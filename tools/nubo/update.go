package main

import (
	"context"
	"debug/elf"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

const maxCLIBinaryBytes int64 = 64 << 20

type cliUpdateRequest struct {
	Root         string
	Descriptor   releaseSources
	DryRun       bool
	BaseURL      string
	Client       *http.Client
	VerifyBinary func(context.Context, string, string) error
}

type cliUpdateResult struct {
	Status         string `json:"status"`
	CurrentVersion string `json:"currentVersion"`
	TargetVersion  string `json:"targetVersion"`
	SHA256         string `json:"sha256"`
	Updated        bool   `json:"updated"`
	CLIPath        string `json:"cliPath"`
}

func updateCLI(ctx context.Context, request cliUpdateRequest, emit func(taskEvent)) (cliUpdateResult, error) {
	sources := request.Descriptor
	destination := filepath.Join(request.Root, ".nubo", "bin", "nubo")
	result := cliUpdateResult{
		Status: "verified", CurrentVersion: version, TargetVersion: sources.Channel.Version,
		Updated: false, CLIPath: destination,
	}
	if err := cliContextError(ctx); err != nil {
		return result, err
	}
	client := request.Client
	if client == nil {
		client = &http.Client{Timeout: 15 * time.Minute}
	}
	baseURL := sources.releaseBase(request.BaseURL)
	emit(taskEvent{Kind: eventStage, Title: "CLI 릴리스 계약 확인", Detail: "NUBO " + sources.Channel.Version + " · Linux amd64"})
	expected, err := fetchExpectedChecksum(ctx, client, baseURL+"/"+sources.CLI.Checksum, sources.CLI.Name, "CLI")
	if err != nil {
		return result, err
	}
	result.SHA256 = expected
	currentHash, hashErr := fileSHA256(destination)
	if hashErr == nil && currentHash == expected {
		result.Status = "current"
		emit(taskEvent{Kind: eventDone, Title: "이미 최신 CLI입니다", Detail: sources.Channel.Version})
		return result, nil
	}
	if hashErr != nil && !errors.Is(hashErr, os.ErrNotExist) {
		return result, fmt.Errorf("현재 CLI를 확인할 수 없습니다: %w", hashErr)
	}

	cacheDir := filepath.Join(request.Root, ".nubo", "downloads")
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return result, err
	}
	cachePath := filepath.Join(cacheDir, sources.CLI.Name)
	cachedHash, cacheErr := fileSHA256(cachePath)
	if cacheErr != nil && !errors.Is(cacheErr, os.ErrNotExist) {
		return result, cacheErr
	}
	if cachedHash != expected {
		_ = os.Remove(cachePath)
		emit(taskEvent{Kind: eventStage, Title: "공식 CLI 다운로드", Detail: sources.CLI.Name})
		if err := fetchFile(ctx, client, baseURL+"/"+sources.CLI.Name, cachePath, maxCLIBinaryBytes, "공식 CLI", "공식 CLI 다운로드", emit); err != nil {
			return result, err
		}
	} else {
		emit(taskEvent{Kind: eventStage, Title: "검증된 다운로드 재사용", Detail: filepath.ToSlash(filepath.Join(".nubo", "downloads", sources.CLI.Name))})
	}
	actual, err := fileSHA256(cachePath)
	if err != nil {
		return result, err
	}
	if actual != expected {
		_ = os.Remove(cachePath)
		return result, fmt.Errorf("CLI SHA-256이 일치하지 않습니다: expected %s, got %s", expected, actual)
	}

	emit(taskEvent{Kind: eventStage, Title: "CLI 실행 파일 검증", Detail: "ELF x86-64 · 실행 버전 " + sources.Channel.Version})
	verify := request.VerifyBinary
	if verify == nil {
		verify = verifyCLIBinary
	}
	if err := installCLIBinary(ctx, cachePath, destination, sources.Channel.Version, request.DryRun, verify); err != nil {
		return result, err
	}
	if request.DryRun {
		result.Status = "dry-run"
		emit(taskEvent{Kind: eventDone, Title: "CLI 검증 완료", Detail: "--dry-run: 현재 CLI는 변경하지 않았습니다"})
		return result, nil
	}
	result.Status = "updated"
	result.Updated = true
	emit(taskEvent{Kind: eventDone, Title: "CLI 업데이트 완료", Detail: sources.Channel.Version})
	return result, nil
}

func installCLIBinary(ctx context.Context, source, destination, targetVersion string, dryRun bool, verify func(context.Context, string, string) error) error {
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()
	info, err := input.Stat()
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() || info.Size() <= 0 || info.Size() > maxCLIBinaryBytes {
		return errors.New("CLI 실행 파일 형식 또는 크기가 올바르지 않습니다")
	}
	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		return err
	}
	temporary, err := os.CreateTemp(filepath.Dir(destination), ".nubo-*.new")
	if err != nil {
		return err
	}
	temporaryPath := temporary.Name()
	defer os.Remove(temporaryPath)
	written, copyErr := io.Copy(temporary, io.LimitReader(input, maxCLIBinaryBytes+1))
	syncErr := temporary.Sync()
	closeErr := temporary.Close()
	if copyErr != nil {
		return copyErr
	}
	if syncErr != nil {
		return syncErr
	}
	if closeErr != nil {
		return closeErr
	}
	if written != info.Size() || written > maxCLIBinaryBytes {
		return errors.New("CLI 실행 파일을 완전히 준비하지 못했습니다")
	}
	if err := os.Chmod(temporaryPath, 0755); err != nil {
		return err
	}
	if err := verify(ctx, temporaryPath, targetVersion); err != nil {
		return err
	}
	if err := cliContextError(ctx); err != nil {
		return err
	}
	if dryRun {
		return nil
	}
	if err := os.Rename(temporaryPath, destination); err != nil {
		return fmt.Errorf("CLI를 원자적으로 교체하지 못했습니다: %w", err)
	}
	return nil
}

func verifyCLIBinary(ctx context.Context, path, targetVersion string) error {
	binary, err := elf.Open(path)
	if err != nil {
		return fmt.Errorf("CLI가 Linux ELF 실행 파일이 아닙니다: %w", err)
	}
	header := binary.FileHeader
	if err := binary.Close(); err != nil {
		return err
	}
	if header.Class != elf.ELFCLASS64 || header.Data != elf.ELFDATA2LSB || header.Machine != elf.EM_X86_64 {
		return errors.New("CLI가 지원 대상 Linux amd64 실행 파일이 아닙니다")
	}
	verifyContext, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	command := exec.CommandContext(verifyContext, path, "version")
	output, err := command.CombinedOutput()
	if err != nil {
		return fmt.Errorf("새 CLI를 실행해 확인하지 못했습니다: %w", err)
	}
	expected := "nubo " + targetVersion
	if strings.TrimSpace(string(output)) != expected {
		return fmt.Errorf("새 CLI 버전이 descriptor와 다릅니다: expected %q, got %q", expected, strings.TrimSpace(string(output)))
	}
	return nil
}

func cliContextError(ctx context.Context) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("CLI 업데이트를 취소했습니다: %w", err)
	}
	return nil
}

func printCLIUpdateResult(writer io.Writer, result cliUpdateResult, color bool) {
	styles := newPalette(color)
	fmt.Fprintln(writer)
	switch result.Status {
	case "current":
		fmt.Fprintln(writer, render(styles.success, "✓ NUBO CLI가 이미 최신입니다"))
	case "dry-run":
		fmt.Fprintln(writer, render(styles.success, "✓ NUBO CLI 검증 완료"))
		fmt.Fprintln(writer, render(styles.muted, "  dry-run이므로 현재 CLI는 변경하지 않았습니다."))
	default:
		fmt.Fprintln(writer, render(styles.success, "✓ NUBO CLI 업데이트 완료"))
	}
	fmt.Fprintf(writer, "  %s · %s\n", result.TargetVersion, shortHash(result.SHA256))
	fmt.Fprintf(writer, "  %s\n", result.CLIPath)
	if result.Updated {
		fmt.Fprintln(writer, render(styles.muted, "  소스·runtime·DB·실행 중인 프로세스는 변경하지 않았습니다."))
		fmt.Fprintln(writer, "\n다음 확인: ./bin/nubo version")
	}
}

func shortHash(value string) string {
	if len(value) > 12 {
		return value[:12]
	}
	return value
}
