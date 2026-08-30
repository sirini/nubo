package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

const maxMarketSkinPackageBytes int64 = 20 << 20

type marketInstallRequest struct {
	Root        string
	Item        marketSkin
	Client      *marketClient
	NUBOVersion string
	DryRun      bool
}

type marketInstallResult struct {
	Status          string `json:"status"`
	Coordinate      string `json:"coordinate"`
	Version         string `json:"version"`
	PreviousVersion string `json:"previousVersion,omitempty"`
	PackageSHA256   string `json:"packageSha256"`
	Compatible      bool   `json:"compatible"`
	Changed         bool   `json:"changed"`
	Destination     string `json:"destination,omitempty"`
	Files           int    `json:"files"`
}

func installMarketSkin(ctx context.Context, request marketInstallRequest, emit func(taskEvent)) (marketInstallResult, error) {
	item := prepareMarketSkin(request.Item, request.NUBOVersion)
	result := marketInstallResult{
		Status: "verified", Coordinate: item.Coordinate, Version: item.Version,
		PackageSHA256: strings.ToLower(item.SHA256), Compatible: item.Compatible,
	}
	if !item.Compatible {
		return result, fmt.Errorf("%s에는 NUBO %s 이상이 필요합니다", item.Coordinate, item.MinNUBOVersion)
	}
	if item.SizeBytes > maxMarketSkinPackageBytes {
		return result, errors.New("Market skin package가 허용 크기를 초과합니다")
	}
	destination := filepath.Join(request.Root, "app", "skins", item.Key)
	result.Destination = destination
	existing, err := existingMarketSkin(destination, item.Key)
	if err != nil {
		return result, err
	}
	if existing != nil {
		result.PreviousVersion = existing.receipt.Version
		result.Files = len(existing.receipt.Files)
		if len(existing.issues) > 0 {
			return result, marketSkinIssuesError(existing.issues)
		}
		if existing.receipt.Version == item.Version {
			if !strings.EqualFold(existing.receipt.PackageSHA256, item.SHA256) {
				return result, errors.New("같은 Market package 버전의 SHA-256이 설치 영수증과 다릅니다")
			}
			result.Status = "current"
			emit(taskEvent{Kind: eventDone, Title: "이미 최신 스킨", Detail: item.Coordinate + "@" + item.Version})
			return result, nil
		}
		if !versionAtLeast(item.Version, existing.receipt.Version) {
			return result, fmt.Errorf("설치 버전보다 오래된 버전으로 되돌리지 않습니다: %s -> %s", existing.receipt.Version, item.Version)
		}
	}

	emit(taskEvent{Kind: eventStage, Title: "Market package 계약 확인", Detail: item.Coordinate + "@" + item.Version})
	archivePath, err := downloadMarketSkinPackage(ctx, request.Root, item, request.Client, emit)
	if err != nil {
		return result, err
	}
	emit(taskEvent{Kind: eventStage, Title: "스킨 package 내부 검증", Detail: "SHA-256 · manifest · 안전한 압축 경로"})
	staged, receipt, err := stageMarketSkinPackage(ctx, archivePath, request.Root, item)
	if err != nil {
		return result, err
	}
	defer os.RemoveAll(filepath.Dir(staged))
	result.Files = len(receipt.Files)
	if request.DryRun {
		result.Status = "dry-run"
		emit(taskEvent{Kind: eventDone, Title: "설치 검증 완료", Detail: "--dry-run: app/skins는 변경하지 않았습니다"})
		return result, nil
	}
	if err := marketInstallContextError(ctx); err != nil {
		return result, err
	}
	if existing == nil {
		emit(taskEvent{Kind: eventStage, Title: "스킨 소스 설치", Detail: filepath.ToSlash(filepath.Join("app", "skins", item.Key))})
		if err := installNewMarketSkin(destination, staged); err != nil {
			return result, err
		}
		result.Status = "installed"
	} else {
		emit(taskEvent{Kind: eventStage, Title: "검증된 스킨 원자적 교체", Detail: existing.receipt.Version + " → " + item.Version})
		if err := ensureMarketSkinUnchanged(destination, existing.receipt); err != nil {
			return result, err
		}
		if err := replaceMarketSkin(destination, staged); err != nil {
			return result, err
		}
		result.Status = "updated"
	}
	result.Changed = true
	emit(taskEvent{Kind: eventDone, Title: "스킨 설치 완료", Detail: item.Coordinate + "@" + item.Version})
	return result, nil
}

type installedMarketSkin struct {
	receipt marketSkinReceipt
	issues  []string
}

func existingMarketSkin(destination, key string) (*installedMarketSkin, error) {
	info, err := os.Lstat(destination)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return nil, fmt.Errorf("스킨 설치 경로가 안전한 폴더가 아닙니다: %s", destination)
	}
	receipt, err := readMarketSkinReceipt(destination, key)
	if err != nil {
		return nil, err
	}
	issues, err := inspectMarketSkin(destination, receipt)
	if err != nil {
		return nil, err
	}
	return &installedMarketSkin{receipt: receipt, issues: issues}, nil
}

func downloadMarketSkinPackage(ctx context.Context, root string, item marketSkin, client *marketClient, emit func(taskEvent)) (string, error) {
	cacheDir := filepath.Join(root, ".nubo", "downloads")
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return "", err
	}
	archiveName := fmt.Sprintf("skin-%s-%s-%s.tar.gz", item.Key, item.Version, strings.ToLower(item.SHA256))
	archivePath := filepath.Join(cacheDir, archiveName)
	actual, err := fileSHA256(archivePath)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return "", err
	}
	if !strings.EqualFold(actual, item.SHA256) {
		_ = os.Remove(archivePath)
		emit(taskEvent{Kind: eventStage, Title: "Market skin 다운로드", Detail: item.Coordinate + "@" + item.Version})
		downloadURL := client.baseURL + "/v1/skins/" + url.PathEscape(item.Key) + "/versions/" + url.PathEscape(item.Version) + "/download"
		if err := fetchFile(ctx, client.client, downloadURL, archivePath, maxMarketSkinPackageBytes, "Market skin package", "Market skin 다운로드", emit); err != nil {
			return "", err
		}
	} else {
		emit(taskEvent{Kind: eventStage, Title: "검증된 Market 다운로드 재사용", Detail: filepath.ToSlash(filepath.Join(".nubo", "downloads", archiveName))})
	}
	actual, err = fileSHA256(archivePath)
	if err != nil {
		return "", err
	}
	if !strings.EqualFold(actual, item.SHA256) {
		_ = os.Remove(archivePath)
		return "", fmt.Errorf("Market skin package SHA-256이 다릅니다: expected %s, got %s", item.SHA256, actual)
	}
	info, err := os.Stat(archivePath)
	if err != nil {
		return "", err
	}
	if info.Size() != item.SizeBytes {
		_ = os.Remove(archivePath)
		return "", fmt.Errorf("Market skin package 크기가 다릅니다: expected %d, got %d", item.SizeBytes, info.Size())
	}
	return archivePath, nil
}

func marketInstallContextError(ctx context.Context) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("스킨 설치를 취소했습니다: %w", err)
	}
	return nil
}

func installNewMarketSkin(destination, staged string) error {
	if _, err := os.Lstat(destination); err == nil {
		return fmt.Errorf("스킨 경로가 설치 준비 중 생성되어 전환을 중단했습니다: %s", destination)
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}
	if err := os.Rename(staged, destination); err != nil {
		return fmt.Errorf("검증한 스킨을 설치할 수 없습니다: %w", err)
	}
	return nil
}

// 기존 폴더를 같은 파일시스템에 보관한 뒤 새 폴더로 바꾸며 rename 실패 시 즉시 복원한다.
func replaceMarketSkin(destination, staged string) error {
	parent := filepath.Dir(destination)
	backup, err := os.MkdirTemp(parent, ".nubo-skin-backup-")
	if err != nil {
		return fmt.Errorf("스킨 백업 경로를 만들 수 없습니다: %w", err)
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
		return fmt.Errorf("설치 후 임시 백업을 지울 수 없습니다: %w", err)
	}
	return nil
}

func printMarketInstallResult(writer io.Writer, result marketInstallResult, color bool) {
	styles := newPalette(color)
	fmt.Fprintln(writer)
	switch result.Status {
	case "current":
		fmt.Fprintln(writer, render(styles.success, "✓ Market 스킨이 이미 최신입니다"))
	case "dry-run":
		fmt.Fprintln(writer, render(styles.success, "✓ Market 스킨 설치 검증 완료"))
	default:
		fmt.Fprintln(writer, render(styles.success, "✓ Market 스킨 설치 완료"))
	}
	fmt.Fprintf(writer, "  %s@%s\n", result.Coordinate, result.Version)
	fmt.Fprintf(writer, "  SHA-256 %s\n", result.PackageSHA256)
	if result.PreviousVersion != "" && result.PreviousVersion != result.Version {
		fmt.Fprintf(writer, "  업데이트 %s → %s\n", result.PreviousVersion, result.Version)
	}
	if result.Status == "dry-run" {
		fmt.Fprintln(writer, render(styles.muted, "  dry-run이므로 app/skins 경로는 변경하지 않았습니다."))
		return
	}
	if result.Status == "current" {
		fmt.Fprintf(writer, "  %s\n", result.Destination)
		return
	}
	fmt.Fprintf(writer, "  %s · 파일 %d개\n\n", result.Destination, result.Files)
	fmt.Fprintln(writer, render(styles.heading, "NUBO가 자동으로 하지 않은 작업"))
	fmt.Fprintln(writer, "  1. git status --short로 설치된 소스와 영수증 확인")
	fmt.Fprintln(writer, "  2. npm run build")
	fmt.Fprintln(writer, "  3. 사용 중인 tmux 또는 PM2 방식으로 Web 프로세스 재시작")
}
