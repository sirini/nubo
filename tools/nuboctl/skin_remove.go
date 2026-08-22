package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type skinRemoval struct {
	key         string
	version     string
	destination string
	files       int
}

func removeSkin(options skinRegistryOptions, output io.Writer) error {
	root, err := resolveSkinSource(options.source)
	if err != nil {
		return err
	}
	destination := filepath.Join(root, "app", "skins", options.key)
	info, err := os.Lstat(destination)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("삭제할 스킨 폴더를 찾을 수 없습니다: %s", destination)
	}
	receipt, err := readSkinReceipt(destination, options.key)
	if err != nil {
		return err
	}
	issues, err := inspectSkinRemoval(destination, receipt)
	if err != nil {
		return err
	}
	if len(issues) > 0 {
		return fmt.Errorf("설치 뒤 변경된 파일이 있어 자동 삭제하지 않습니다:\n  - %s", strings.Join(issues, "\n  - "))
	}
	removal := skinRemoval{key: receipt.Key, version: receipt.Version, destination: destination, files: len(receipt.Files)}
	writeMarketRemovePlan(output, removal, options.dryRun)
	if options.dryRun {
		return nil
	}
	if err := removeVerifiedSkin(destination); err != nil {
		return err
	}
	writeMarketRemoveComplete(output, removal)
	return nil
}

func inspectSkinRemoval(directory string, receipt skinReceipt) ([]string, error) {
	expected := make(map[string]string, len(receipt.Files))
	for _, file := range receipt.Files {
		expected[file.Path] = strings.ToLower(file.SHA256)
	}
	seen := make(map[string]bool, len(expected))
	issues := []string{}
	err := filepath.WalkDir(directory, func(filename string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if filename == directory || entry.IsDir() {
			return nil
		}
		relative, err := filepath.Rel(directory, filename)
		if err != nil {
			return err
		}
		relative = filepath.ToSlash(relative)
		if relative == skinReceiptName {
			return nil
		}
		expectedHash, ok := expected[relative]
		if !ok {
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
	for path := range expected {
		if !seen[path] {
			issues = append(issues, path+" (파일 누락)")
		}
	}
	sort.Strings(issues)
	return issues, nil
}

func removeVerifiedSkin(destination string) error {
	parent := filepath.Dir(destination)
	temporary, err := os.MkdirTemp(parent, ".nubo-skin-remove-")
	if err != nil {
		return fmt.Errorf("삭제 준비 폴더를 만들 수 없습니다: %w", err)
	}
	if err := os.Remove(temporary); err != nil {
		return err
	}
	if err := os.Rename(destination, temporary); err != nil {
		return fmt.Errorf("검증한 스킨을 삭제 준비 상태로 옮길 수 없습니다: %w", err)
	}
	if err := os.RemoveAll(temporary); err != nil {
		_ = os.Rename(temporary, destination)
		return fmt.Errorf("스킨 폴더를 삭제할 수 없습니다: %w", err)
	}
	return nil
}
