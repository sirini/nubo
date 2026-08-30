package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
)

const (
	marketSkinReceiptName     = ".nubo-market.json"
	maxMarketSkinReceiptBytes = 2 << 20
)

type marketSkinReceiptFile struct {
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
}

// 기존 nubo-market 설치와 호환되는 영수증 형식을 유지해 안전한 업데이트 경계를 이어간다.
type marketSkinReceipt struct {
	SchemaVersion int                     `json:"schema_version"`
	Key           string                  `json:"key"`
	Version       string                  `json:"version"`
	PackageSHA256 string                  `json:"package_sha256"`
	Files         []marketSkinReceiptFile `json:"files"`
}

func writeMarketSkinReceipt(directory string, item marketSkin, files []marketSkinReceiptFile) (marketSkinReceipt, error) {
	sort.Slice(files, func(left, right int) bool { return files[left].Path < files[right].Path })
	receipt := marketSkinReceipt{
		SchemaVersion: 1,
		Key:           item.Key,
		Version:       item.Version,
		PackageSHA256: strings.ToLower(item.SHA256),
		Files:         files,
	}
	if err := validateMarketSkinReceipt(receipt, item.Key); err != nil {
		return marketSkinReceipt{}, err
	}
	content, err := json.MarshalIndent(receipt, "", "  ")
	if err != nil {
		return marketSkinReceipt{}, fmt.Errorf("설치 영수증을 만들 수 없습니다: %w", err)
	}
	filename := filepath.Join(directory, marketSkinReceiptName)
	if err := os.WriteFile(filename, append(content, '\n'), 0644); err != nil {
		return marketSkinReceipt{}, fmt.Errorf("설치 영수증을 저장할 수 없습니다: %w", err)
	}
	return receipt, nil
}

func readMarketSkinReceipt(directory, key string) (marketSkinReceipt, error) {
	filename := filepath.Join(directory, marketSkinReceiptName)
	info, err := os.Lstat(filename)
	if err != nil || !info.Mode().IsRegular() {
		return marketSkinReceipt{}, fmt.Errorf("Market 설치 영수증이 없어 자동 교체할 수 없습니다: %s", filename)
	}
	if info.Size() > maxMarketSkinReceiptBytes {
		return marketSkinReceipt{}, errors.New("Market 설치 영수증이 허용 크기를 초과합니다")
	}
	content, err := os.ReadFile(filename)
	if err != nil {
		return marketSkinReceipt{}, fmt.Errorf("Market 설치 영수증을 읽을 수 없습니다: %w", err)
	}
	var receipt marketSkinReceipt
	decoder := json.NewDecoder(bytes.NewReader(content))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&receipt); err != nil {
		return marketSkinReceipt{}, fmt.Errorf("Market 설치 영수증이 손상되었습니다: %w", err)
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return marketSkinReceipt{}, errors.New("Market 설치 영수증 뒤에 예상하지 못한 값이 있습니다")
	}
	if err := validateMarketSkinReceipt(receipt, key); err != nil {
		return marketSkinReceipt{}, err
	}
	return receipt, nil
}

func validateMarketSkinReceipt(receipt marketSkinReceipt, key string) error {
	packageHash, hashErr := hex.DecodeString(receipt.PackageSHA256)
	valid := receipt.SchemaVersion == 1 && receipt.Key == key && marketKeyPattern.MatchString(receipt.Key) &&
		marketVersionPattern.MatchString(receipt.Version) && hashErr == nil && len(packageHash) == sha256.Size &&
		receipt.PackageSHA256 == strings.ToLower(receipt.PackageSHA256) && len(receipt.Files) > 0 && len(receipt.Files) <= maxMarketSkinFiles
	if !valid {
		return errors.New("Market 설치 영수증의 package identity가 올바르지 않습니다")
	}
	seen := make(map[string]bool, len(receipt.Files))
	for _, file := range receipt.Files {
		checksum, err := hex.DecodeString(file.SHA256)
		if !safeMarketReceiptPath(file.Path) || seen[file.Path] || err != nil || len(checksum) != sha256.Size || file.SHA256 != strings.ToLower(file.SHA256) {
			return fmt.Errorf("Market 설치 영수증의 파일 정보가 올바르지 않습니다: %s", file.Path)
		}
		seen[file.Path] = true
	}
	return nil
}

func safeMarketReceiptPath(value string) bool {
	clean := path.Clean(value)
	return value != "" && value != marketSkinReceiptName && clean == value && !path.IsAbs(value) &&
		!strings.Contains(value, "\\") && clean != ".." && !strings.HasPrefix(clean, "../")
}

func inspectMarketSkin(directory string, receipt marketSkinReceipt) ([]string, error) {
	expectedFiles := make(map[string]string, len(receipt.Files))
	expectedDirs := map[string]bool{".": true}
	for _, file := range receipt.Files {
		expectedFiles[file.Path] = file.SHA256
		for parent := path.Dir(file.Path); parent != "."; parent = path.Dir(parent) {
			expectedDirs[parent] = true
		}
	}
	seen := make(map[string]bool, len(expectedFiles))
	issues := []string{}
	err := filepath.WalkDir(directory, func(filename string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if filename == directory {
			return nil
		}
		relative, err := filepath.Rel(directory, filename)
		if err != nil {
			return err
		}
		relative = filepath.ToSlash(relative)
		if relative == marketSkinReceiptName {
			return nil
		}
		if entry.IsDir() {
			if !expectedDirs[relative] {
				issues = append(issues, relative+"/ (설치 영수증에 없는 폴더)")
			}
			return nil
		}
		expectedHash, present := expectedFiles[relative]
		if !present {
			issues = append(issues, relative+" (설치 영수증에 없는 파일)")
			return nil
		}
		seen[relative] = true
		if entry.Type()&os.ModeSymlink != 0 || !entry.Type().IsRegular() {
			issues = append(issues, relative+" (일반 파일이 아님)")
			return nil
		}
		actualHash, err := fileSHA256(filename)
		if err != nil {
			return err
		}
		if actualHash != expectedHash {
			issues = append(issues, relative+" (checksum 변경됨)")
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("스킨 파일을 검사할 수 없습니다: %w", err)
	}
	for filename := range expectedFiles {
		if !seen[filename] {
			issues = append(issues, filename+" (파일 누락)")
		}
	}
	sort.Strings(issues)
	return issues, nil
}

func ensureMarketSkinUnchanged(destination string, original marketSkinReceipt) error {
	current, err := readMarketSkinReceipt(destination, original.Key)
	if err != nil {
		return err
	}
	issues, err := inspectMarketSkin(destination, current)
	if err != nil {
		return err
	}
	if !reflect.DeepEqual(current, original) || len(issues) > 0 {
		return errors.New("설치 준비 중 로컬 스킨이 바뀌어 전환을 중단했습니다")
	}
	return nil
}

func marketSkinIssuesError(issues []string) error {
	const shownLimit = 20
	shown := issues
	remaining := 0
	if len(shown) > shownLimit {
		shown = shown[:shownLimit]
		remaining = len(issues) - shownLimit
	}
	message := "로컬 변경이 있어 Market package로 교체하지 않습니다:\n  - " + strings.Join(shown, "\n  - ")
	if remaining > 0 {
		message += fmt.Sprintf("\n  - 그 외 %d개", remaining)
	}
	return errors.New(message)
}
