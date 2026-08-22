package main

import (
	"archive/tar"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"strings"
)

const (
	maxSkinFiles         = 1000
	maxSkinExpandedBytes = 100 << 20
)

type skinArchiveState struct {
	root          string
	item          registrySkin
	files         int
	expandedBytes int64
	manifestFound bool
	receiptFiles  []skinReceiptFile
}

// 모든 파일을 격리 디렉터리에 푼 뒤 manifest까지 확인된 경우에만 최종 폴더로 전환한다.
func extractSkinPackage(filename, skinsDir string, item registrySkin) error {
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	gz, err := gzip.NewReader(file)
	if err != nil {
		return fmt.Errorf("스킨 패키지가 gzip 형식이 아닙니다: %w", err)
	}
	defer gz.Close()
	temporary, err := os.MkdirTemp(skinsDir, ".nubo-skin-install-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(temporary)
	state := skinArchiveState{root: temporary, item: item}
	if err := extractSkinEntries(tar.NewReader(gz), &state); err != nil {
		return err
	}
	if !state.manifestFound {
		return fmt.Errorf("스킨 패키지에 skin.json이 없습니다")
	}
	installed := filepath.Join(temporary, item.Key)
	if err := writeSkinReceipt(installed, item, state.receiptFiles); err != nil {
		return err
	}
	return os.Rename(installed, filepath.Join(skinsDir, item.Key))
}

func extractSkinEntries(reader *tar.Reader, state *skinArchiveState) error {
	for {
		header, err := reader.Next()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return fmt.Errorf("스킨 패키지가 손상되었습니다: %w", err)
		}
		state.files++
		if state.files > maxSkinFiles {
			return fmt.Errorf("스킨 패키지 파일 수가 너무 많습니다")
		}
		target, clean, err := safeSkinTarget(state.root, state.item.Key, header.Name)
		if err != nil {
			return err
		}
		if err := extractSkinEntry(reader, header, target, clean, state); err != nil {
			return err
		}
	}
}

func safeSkinTarget(root, key, name string) (string, string, error) {
	name = strings.TrimSuffix(name, "/")
	clean := path.Clean(name)
	unsafe := name == "" || clean != name || path.IsAbs(name) || strings.Contains(name, "\\") || clean == ".." || strings.HasPrefix(clean, "../")
	if unsafe {
		return "", "", fmt.Errorf("안전하지 않은 스킨 경로입니다: %s", name)
	}
	if strings.Split(clean, "/")[0] != key {
		return "", "", fmt.Errorf("패키지 폴더와 스킨 key가 다릅니다")
	}
	target := filepath.Join(root, filepath.FromSlash(clean))
	relative, err := filepath.Rel(root, target)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(os.PathSeparator)) {
		return "", "", fmt.Errorf("스킨 경로가 설치 폴더를 벗어납니다")
	}
	return target, clean, nil
}

func extractSkinEntry(reader *tar.Reader, header *tar.Header, target, clean string, state *skinArchiveState) error {
	switch header.Typeflag {
	case tar.TypeDir:
		return os.MkdirAll(target, 0755)
	case tar.TypeReg, tar.TypeRegA:
		return extractSkinFile(reader, header, target, clean, state)
	default:
		return fmt.Errorf("스킨 패키지의 링크나 특수 파일은 허용하지 않습니다")
	}
}

func extractSkinFile(reader *tar.Reader, header *tar.Header, target, clean string, state *skinArchiveState) error {
	state.expandedBytes += header.Size
	if header.Size < 0 || state.expandedBytes > maxSkinExpandedBytes {
		return fmt.Errorf("압축 해제 크기가 허용 범위를 초과했습니다")
	}
	if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
		return err
	}
	relative := strings.TrimPrefix(clean, state.item.Key+"/")
	if relative == skinReceiptName {
		return fmt.Errorf("스킨 패키지는 예약 파일 %s을 포함할 수 없습니다", skinReceiptName)
	}
	output, err := os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	hash := sha256.New()
	copied, copyErr := io.Copy(io.MultiWriter(output, hash), io.LimitReader(reader, header.Size))
	closeErr := output.Close()
	if copyErr != nil || closeErr != nil || copied != header.Size {
		return fmt.Errorf("스킨 파일을 쓸 수 없습니다")
	}
	if clean == state.item.Key+"/skin.json" {
		if err := verifyInstalledManifest(target, state); err != nil {
			return err
		}
	}
	state.receiptFiles = append(state.receiptFiles, skinReceiptFile{Path: relative, SHA256: hex.EncodeToString(hash.Sum(nil))})
	return nil
}

func verifyInstalledManifest(filename string, state *skinArchiveState) error {
	contents, err := os.ReadFile(filename)
	if err != nil {
		return err
	}
	var manifest registrySkin
	if json.Unmarshal(contents, &manifest) != nil || manifest.Key != state.item.Key || manifest.Version != state.item.Version {
		return fmt.Errorf("패키지 manifest와 Registry 메타데이터가 다릅니다")
	}
	state.manifestFound = true
	return nil
}
