package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
)

const skinReceiptName = ".nubo-market.json"

type skinReceiptFile struct {
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
}

type skinReceipt struct {
	SchemaVersion int               `json:"schema_version"`
	Key           string            `json:"key"`
	Version       string            `json:"version"`
	PackageSHA256 string            `json:"package_sha256"`
	Files         []skinReceiptFile `json:"files"`
}

func writeSkinReceipt(directory string, item registrySkin, files []skinReceiptFile) error {
	sort.Slice(files, func(left, right int) bool { return files[left].Path < files[right].Path })
	receipt := skinReceipt{
		SchemaVersion: 1,
		Key:           item.Key,
		Version:       item.Version,
		PackageSHA256: strings.ToLower(item.SHA256),
		Files:         files,
	}
	contents, err := json.MarshalIndent(receipt, "", "  ")
	if err != nil {
		return fmt.Errorf("설치 영수증을 만들 수 없습니다: %w", err)
	}
	filename := filepath.Join(directory, skinReceiptName)
	if err := os.WriteFile(filename, append(contents, '\n'), 0644); err != nil {
		return fmt.Errorf("설치 영수증을 저장할 수 없습니다: %w", err)
	}
	return nil
}

func readSkinReceipt(directory, key string) (skinReceipt, error) {
	filename := filepath.Join(directory, skinReceiptName)
	info, err := os.Lstat(filename)
	if err != nil || !info.Mode().IsRegular() {
		return skinReceipt{}, fmt.Errorf("Market 설치 영수증이 없어 자동 삭제할 수 없습니다: %s", filename)
	}
	contents, err := os.ReadFile(filename)
	if err != nil {
		return skinReceipt{}, fmt.Errorf("Market 설치 영수증을 읽을 수 없습니다: %w", err)
	}
	var receipt skinReceipt
	if err := json.Unmarshal(contents, &receipt); err != nil {
		return skinReceipt{}, fmt.Errorf("Market 설치 영수증이 손상되었습니다: %w", err)
	}
	if err := validateSkinReceipt(receipt, key); err != nil {
		return skinReceipt{}, err
	}
	return receipt, nil
}

func validateSkinReceipt(receipt skinReceipt, key string) error {
	packageHash, hashErr := hex.DecodeString(receipt.PackageSHA256)
	valid := receipt.SchemaVersion == 1 && receipt.Key == key && skinKeyPattern.MatchString(receipt.Key) &&
		skinVersionPattern.MatchString(receipt.Version) && hashErr == nil && len(packageHash) == sha256.Size && len(receipt.Files) > 0
	if !valid {
		return fmt.Errorf("Market 설치 영수증의 package identity가 올바르지 않습니다")
	}
	seen := make(map[string]bool, len(receipt.Files))
	for _, file := range receipt.Files {
		checksum, err := hex.DecodeString(file.SHA256)
		if !safeReceiptPath(file.Path) || seen[file.Path] || err != nil || len(checksum) != sha256.Size {
			return fmt.Errorf("Market 설치 영수증의 파일 정보가 올바르지 않습니다: %s", file.Path)
		}
		seen[file.Path] = true
	}
	return nil
}

func safeReceiptPath(value string) bool {
	clean := path.Clean(value)
	return value != "" && value != skinReceiptName && clean == value && !path.IsAbs(value) &&
		!strings.Contains(value, "\\") && clean != ".." && !strings.HasPrefix(clean, "../")
}
