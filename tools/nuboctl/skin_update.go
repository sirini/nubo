package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type skinUpdate struct {
	key, fromVersion, toVersion, destination string
	files                                    int
}

func diffSkin(options skinRegistryOptions, output io.Writer) error {
	_, receipt, destination, issues, err := inspectInstalledSkin(options)
	if err != nil {
		return err
	}
	writeMarketDiff(output, receipt, destination, issues)
	return nil
}

func updateSkin(ctx context.Context, client *http.Client, options skinRegistryOptions, output io.Writer) error {
	root, receipt, destination, issues, err := inspectInstalledSkin(options)
	if err != nil {
		return err
	}
	if len(issues) > 0 {
		return fmt.Errorf("로컬 변경이 있어 자동 업데이트하지 않습니다. nubo-market diff %s로 확인하고 fork 하세요:\n  - %s", options.key, strings.Join(issues, "\n  - "))
	}
	item, err := getRegistrySkin(ctx, client, options)
	if err != nil {
		return err
	}
	if err := validateRegistrySkin(item, options.key); err != nil {
		return err
	}
	if err := checkSkinCompatibility(root, item); err != nil {
		return err
	}
	if item.Version == receipt.Version {
		writeMarketUpToDate(output, receipt)
		return nil
	}
	if versionLess(item.Version, receipt.Version) {
		return fmt.Errorf("설치 버전보다 오래된 버전으로 되돌리지 않습니다: %s -> %s", receipt.Version, item.Version)
	}
	skinsDir := filepath.Dir(destination)
	packagePath, err := downloadSkinPackage(ctx, client, skinsDir, item)
	if err != nil {
		return err
	}
	defer os.Remove(packagePath)
	staged, err := stageSkinPackage(packagePath, skinsDir, item)
	if err != nil {
		return err
	}
	defer os.RemoveAll(filepath.Dir(staged))
	change := skinUpdate{key: item.Key, fromVersion: receipt.Version, toVersion: item.Version, destination: destination, files: len(receipt.Files)}
	writeMarketUpdatePlan(output, change, options.dryRun)
	if options.dryRun {
		return nil
	}
	if err := ensureSkinStillUnchanged(options, receipt); err != nil {
		return err
	}
	if err := replaceVerifiedSkin(destination, staged); err != nil {
		return err
	}
	writeMarketUpdateComplete(output, change)
	return nil
}

func ensureSkinStillUnchanged(options skinRegistryOptions, original skinReceipt) error {
	_, current, _, issues, err := inspectInstalledSkin(options)
	if err != nil {
		return err
	}
	identityChanged := current.Version != original.Version || current.PackageSHA256 != original.PackageSHA256
	if identityChanged || len(issues) > 0 {
		return fmt.Errorf("업데이트 준비 중 로컬 파일이 바뀌어 전환을 중단했습니다")
	}
	return nil
}

func inspectInstalledSkin(options skinRegistryOptions) (string, skinReceipt, string, []string, error) {
	root, err := resolveSkinSource(options.source)
	if err != nil {
		return "", skinReceipt{}, "", nil, err
	}
	destination := filepath.Join(root, "app", "skins", options.key)
	info, err := os.Lstat(destination)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return "", skinReceipt{}, "", nil, fmt.Errorf("설치된 스킨 폴더를 찾을 수 없습니다: %s", destination)
	}
	receipt, err := readSkinReceipt(destination, options.key)
	if err != nil {
		return "", skinReceipt{}, "", nil, err
	}
	issues, err := inspectSkinRemoval(destination, receipt)
	if err != nil {
		return "", skinReceipt{}, "", nil, err
	}
	return root, receipt, destination, issues, nil
}

// 검증한 기존 폴더를 보관한 뒤 새 폴더로 바꾸며 실패하면 즉시 복원한다.
func replaceVerifiedSkin(destination, staged string) error {
	parent := filepath.Dir(destination)
	backup, err := os.MkdirTemp(parent, ".nubo-skin-backup-")
	if err != nil {
		return fmt.Errorf("업데이트 백업 경로를 만들 수 없습니다: %w", err)
	}
	if err := os.Remove(backup); err != nil {
		return err
	}
	if err := os.Rename(destination, backup); err != nil {
		return fmt.Errorf("기존 스킨을 백업할 수 없습니다: %w", err)
	}
	if err := os.Rename(staged, destination); err != nil {
		_ = os.Rename(backup, destination)
		return fmt.Errorf("새 스킨으로 전환할 수 없습니다: %w", err)
	}
	if err := os.RemoveAll(backup); err != nil {
		return fmt.Errorf("업데이트 뒤 임시 백업을 지울 수 없습니다: %w", err)
	}
	return nil
}
