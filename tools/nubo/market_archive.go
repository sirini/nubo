package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"slices"
	"strings"
)

const (
	maxMarketSkinFiles         = 1000
	maxMarketSkinExpandedBytes = 100 << 20
	maxMarketSkinManifestBytes = 64 << 10
	maxMarketSkinImageBytes    = 8 << 20
)

var marketSkinEntryFiles = map[string]bool{
	"Layout.vue": true, "Home.vue": true, "Admin.vue": true, "Login.vue": true,
	"Profile.vue": true, "Privacy.vue": true, "Error.vue": true, "DefaultList.vue": true,
	"BoardList.vue": true, "GalleryList.vue": true, "BlogList.vue": true, "TradeList.vue": true,
}

type marketSkinPackageManifest struct {
	Type           string   `json:"type,omitempty"`
	Key            string   `json:"key"`
	Name           string   `json:"name"`
	Version        string   `json:"version"`
	Author         string   `json:"author"`
	Website        string   `json:"website"`
	Description    string   `json:"description"`
	Preview        string   `json:"preview"`
	Screenshots    []string `json:"screenshots,omitempty"`
	Features       []string `json:"features"`
	MinNUBOVersion string   `json:"min_nubo_version"`
}

type marketSkinArchiveState struct {
	root          string
	item          marketSkin
	files         int
	expandedBytes int64
	manifest      marketSkinPackageManifest
	manifestFound bool
	hasEntry      bool
	seen          map[string]bool
	receiptFiles  []marketSkinReceiptFile
	ctx           context.Context
}

// package 전체를 프로젝트 내부 staging에 푼 뒤 manifest와 asset까지 확인해야 최종 경로로 전환할 수 있다.
func stageMarketSkinPackage(ctx context.Context, filename, projectRoot string, item marketSkin) (string, marketSkinReceipt, error) {
	stagingParent := filepath.Join(projectRoot, ".nubo", "staging")
	if err := os.MkdirAll(stagingParent, 0755); err != nil {
		return "", marketSkinReceipt{}, err
	}
	temporary, err := os.MkdirTemp(stagingParent, "skin-")
	if err != nil {
		return "", marketSkinReceipt{}, err
	}
	fail := func(err error) (string, marketSkinReceipt, error) {
		_ = os.RemoveAll(temporary)
		return "", marketSkinReceipt{}, err
	}
	file, err := os.Open(filename)
	if err != nil {
		return fail(err)
	}
	defer file.Close()
	compressed, err := gzip.NewReader(file)
	if err != nil {
		return fail(fmt.Errorf("스킨 package가 gzip 형식이 아닙니다: %w", err))
	}
	defer compressed.Close()
	state := marketSkinArchiveState{root: temporary, item: item, seen: make(map[string]bool), ctx: ctx}
	if err := extractMarketSkinEntries(tar.NewReader(compressed), &state); err != nil {
		return fail(err)
	}
	if !state.manifestFound {
		return fail(errors.New("스킨 package에 skin.json이 없습니다"))
	}
	if !state.hasEntry {
		return fail(errors.New("스킨 package에 지원되는 최상위 Vue entry가 없습니다"))
	}
	installed := filepath.Join(temporary, item.Key)
	if err := verifyMarketSkinAssets(installed, state.manifest); err != nil {
		return fail(err)
	}
	receipt, err := writeMarketSkinReceipt(installed, item, state.receiptFiles)
	if err != nil {
		return fail(err)
	}
	return installed, receipt, nil
}

func extractMarketSkinEntries(reader *tar.Reader, state *marketSkinArchiveState) error {
	for {
		if err := marketInstallContextError(state.ctx); err != nil {
			return err
		}
		header, err := reader.Next()
		if errors.Is(err, io.EOF) {
			return nil
		}
		if err != nil {
			return fmt.Errorf("스킨 package가 손상되었습니다: %w", err)
		}
		state.files++
		if state.files > maxMarketSkinFiles {
			return errors.New("스킨 package 파일 수가 허용 범위를 초과합니다")
		}
		target, clean, err := safeMarketSkinTarget(state.root, state.item.Key, header.Name)
		if err != nil {
			return err
		}
		if state.seen[clean] {
			return fmt.Errorf("스킨 package 경로가 중복됩니다: %s", clean)
		}
		state.seen[clean] = true
		switch header.Typeflag {
		case tar.TypeDir:
			// 빈 디렉터리는 source package 계약에 포함하지 않는다. 파일 추출 시 필요한 부모만 만든다.
			continue
		case tar.TypeReg, tar.TypeRegA:
			if err := extractMarketSkinFile(reader, header, target, clean, state); err != nil {
				return err
			}
		default:
			return fmt.Errorf("스킨 package의 링크나 특수 파일은 허용하지 않습니다: %s", clean)
		}
	}
}

func safeMarketSkinTarget(root, key, name string) (string, string, error) {
	name = strings.TrimSuffix(name, "/")
	clean := path.Clean(name)
	unsafe := name == "" || clean != name || path.IsAbs(name) || strings.Contains(name, "\\") ||
		clean == ".." || strings.HasPrefix(clean, "../") || strings.ContainsRune(name, 0)
	if unsafe {
		return "", "", fmt.Errorf("안전하지 않은 스킨 package 경로입니다: %s", name)
	}
	parts := strings.Split(clean, "/")
	if parts[0] != key {
		return "", "", errors.New("package 최상위 폴더와 스킨 key가 다릅니다")
	}
	target := filepath.Join(root, filepath.FromSlash(clean))
	if !pathWithin(root, target) {
		return "", "", errors.New("스킨 package 경로가 staging을 벗어납니다")
	}
	return target, clean, nil
}

func extractMarketSkinFile(reader *tar.Reader, header *tar.Header, target, clean string, state *marketSkinArchiveState) error {
	if header.Size < 0 {
		return fmt.Errorf("스킨 파일 크기가 올바르지 않습니다: %s", clean)
	}
	state.expandedBytes += header.Size
	if state.expandedBytes > maxMarketSkinExpandedBytes {
		return errors.New("스킨 package 압축 해제 크기가 허용 범위를 초과합니다")
	}
	if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
		return err
	}
	relative := strings.TrimPrefix(clean, state.item.Key+"/")
	if relative == marketSkinReceiptName {
		return fmt.Errorf("스킨 package는 예약 파일 %s을 포함할 수 없습니다", marketSkinReceiptName)
	}
	output, err := os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	hash := sha256.New()
	written, copyErr := io.Copy(io.MultiWriter(output, hash), io.LimitReader(reader, header.Size+1))
	closeErr := output.Close()
	if copyErr != nil || closeErr != nil || written != header.Size {
		return fmt.Errorf("스킨 파일을 완전히 추출하지 못했습니다: %s", clean)
	}
	if clean == state.item.Key+"/skin.json" {
		manifest, err := verifyMarketSkinManifest(target, state.item)
		if err != nil {
			return err
		}
		state.manifest = manifest
		state.manifestFound = true
	}
	parts := strings.Split(relative, "/")
	if len(parts) == 1 && marketSkinEntryFiles[parts[0]] {
		state.hasEntry = true
	}
	state.receiptFiles = append(state.receiptFiles, marketSkinReceiptFile{Path: relative, SHA256: hex.EncodeToString(hash.Sum(nil))})
	return nil
}

func verifyMarketSkinManifest(filename string, item marketSkin) (marketSkinPackageManifest, error) {
	manifest, err := readMarketSkinManifest(filename)
	if err != nil {
		return manifest, err
	}
	matches := manifest.Key == item.Key && manifest.Name == item.Name && manifest.Version == item.Version &&
		manifest.Author == item.Author && manifest.Website == item.Website && manifest.Description == item.Description &&
		manifest.Preview == item.Preview && slices.Equal(manifest.Screenshots, item.Screenshots) &&
		slices.Equal(manifest.Features, item.Features) && manifest.MinNUBOVersion == item.MinNUBOVersion
	if !matches {
		return manifest, errors.New("package skin.json과 Market 메타데이터가 다릅니다")
	}
	return manifest, nil
}

func readMarketSkinManifest(filename string) (marketSkinPackageManifest, error) {
	info, err := os.Stat(filename)
	if err != nil || info.Size() > maxMarketSkinManifestBytes {
		return marketSkinPackageManifest{}, errors.New("skin.json이 없거나 허용 크기를 초과합니다")
	}
	content, err := os.ReadFile(filename)
	if err != nil {
		return marketSkinPackageManifest{}, err
	}
	var manifest marketSkinPackageManifest
	decoder := json.NewDecoder(bytes.NewReader(content))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&manifest); err != nil {
		return manifest, fmt.Errorf("skin.json 형식이 올바르지 않습니다: %w", err)
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return manifest, errors.New("skin.json 뒤에 예상하지 못한 값이 있습니다")
	}
	return manifest, nil
}

func verifyMarketSkinAssets(directory string, manifest marketSkinPackageManifest) error {
	assets := append([]string{manifest.Preview}, manifest.Screenshots...)
	seen := make(map[string]bool, len(assets))
	for _, asset := range assets {
		if !safeMarketReceiptPath(asset) || seen[asset] {
			return fmt.Errorf("스킨 이미지 경로가 올바르지 않습니다: %s", asset)
		}
		seen[asset] = true
		filename := filepath.Join(directory, filepath.FromSlash(asset))
		if !pathWithin(directory, filename) {
			return fmt.Errorf("스킨 이미지 경로가 설치 폴더를 벗어납니다: %s", asset)
		}
		file, err := os.Open(filename)
		if err != nil {
			return fmt.Errorf("스킨 이미지가 없습니다: %s", asset)
		}
		info, statErr := file.Stat()
		prefix := make([]byte, 512)
		read, readErr := io.ReadFull(file, prefix)
		_ = file.Close()
		if readErr != nil && !errors.Is(readErr, io.EOF) && !errors.Is(readErr, io.ErrUnexpectedEOF) {
			return readErr
		}
		if statErr != nil || !info.Mode().IsRegular() || info.Size() < 1 || info.Size() > maxMarketSkinImageBytes {
			return fmt.Errorf("스킨 이미지 크기가 올바르지 않습니다: %s", asset)
		}
		contentType := http.DetectContentType(prefix[:read])
		if contentType != "image/png" && contentType != "image/jpeg" && contentType != "image/webp" {
			return fmt.Errorf("스킨 이미지는 PNG, JPEG 또는 WebP여야 합니다: %s", asset)
		}
	}
	return nil
}
