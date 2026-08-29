package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const maxRuntimeArchiveBytes int64 = 512 << 20

type runtimeRequest struct {
	Root       string
	Descriptor releaseSources
	DryRun     bool
	BaseURL    string
	Client     *http.Client
}

type runtimeResult struct {
	Status            string `json:"status"`
	Version           string `json:"version"`
	GOAPICommit       string `json:"goapiCommit"`
	APIContract       string `json:"apiContract"`
	ArchiveSHA256     string `json:"archiveSha256"`
	MigrationRequired bool   `json:"migrationRequired"`
	Installed         bool   `json:"installed"`
	GOAPIPath         string `json:"goapiPath,omitempty"`
	LibraryPath       string `json:"libraryPath,omitempty"`
}

type runtimeReceipt struct {
	SchemaVersion int    `json:"schemaVersion"`
	Version       string `json:"version"`
	GOAPICommit   string `json:"goapiCommit"`
	APIContract   string `json:"apiContract"`
	Archive       string `json:"archive"`
	SHA256        string `json:"sha256"`
	InstalledAt   string `json:"installedAt"`
}

func downloadRuntime(ctx context.Context, request runtimeRequest, emit func(taskEvent)) (runtimeResult, error) {
	sources := request.Descriptor
	result := runtimeResult{
		Status: "verified", Version: sources.Channel.Version, GOAPICommit: sources.GOAPI.Commit,
		APIContract: sources.APIContract, MigrationRequired: sources.Runtime.MigrationRequired, Installed: false,
	}
	if err := runtimeContextError(ctx); err != nil {
		return result, err
	}
	baseURL := sources.releaseBase(request.BaseURL)
	cacheDir := filepath.Join(request.Root, ".nubo", "downloads")
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return result, err
	}
	client := request.Client
	if client == nil {
		client = &http.Client{Timeout: 15 * time.Minute}
	}

	emit(taskEvent{Kind: eventStage, Title: "릴리스 계약 확인", Detail: fmt.Sprintf("NUBO %s · API v%s", sources.Channel.Version, sources.APIContract)})
	checksumURL := baseURL + "/" + sources.Runtime.Checksum
	expected, err := fetchExpectedChecksum(ctx, client, checksumURL, sources.Runtime.Name, "runtime")
	if err != nil {
		return result, err
	}
	archivePath := filepath.Join(cacheDir, sources.Runtime.Name)
	actual, err := fileSHA256(archivePath)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return result, err
	}
	if actual != expected {
		_ = os.Remove(archivePath)
		emit(taskEvent{Kind: eventStage, Title: "공식 runtime 다운로드", Detail: sources.Runtime.Name})
		if err := fetchFile(ctx, client, baseURL+"/"+sources.Runtime.Name, archivePath, maxRuntimeArchiveBytes, "공식 runtime", "공식 runtime 다운로드", emit); err != nil {
			return result, err
		}
	} else {
		emit(taskEvent{Kind: eventStage, Title: "검증된 다운로드 재사용", Detail: filepath.ToSlash(filepath.Join(".nubo", "downloads", sources.Runtime.Name))})
	}
	actual, err = fileSHA256(archivePath)
	if err != nil {
		return result, err
	}
	if actual != expected {
		_ = os.Remove(archivePath)
		return result, fmt.Errorf("runtime SHA-256이 일치하지 않습니다: expected %s, got %s", expected, actual)
	}
	result.ArchiveSHA256 = actual

	emit(taskEvent{Kind: eventStage, Title: "runtime 내부 검증", Detail: "manifest · 파일 checksum · 안전한 압축 경로"})
	if err := runtimeContextError(ctx); err != nil {
		return result, err
	}
	stageRoot, manifest, err := extractAndVerifyRuntime(archivePath, request.Root, sources)
	if err != nil {
		return result, err
	}
	defer os.RemoveAll(stageRoot)
	if err := runtimeContextError(ctx); err != nil {
		return result, err
	}
	if request.DryRun {
		result.Status = "dry-run"
		emit(taskEvent{Kind: eventDone, Title: "검증 완료", Detail: "--dry-run: runtime 설치 경로는 변경하지 않았습니다"})
		return result, nil
	}

	emit(taskEvent{Kind: eventStage, Title: "작업 공간에 원자적 배치", Detail: "bin/goapi · lib · licenses/sharp-libvips"})
	if err := runtimeContextError(ctx); err != nil {
		return result, err
	}
	if err := installRuntime(request.Root, stageRoot, manifest, runtimeReceipt{
		SchemaVersion: 1, Version: sources.Channel.Version, GOAPICommit: sources.GOAPI.Commit,
		APIContract: sources.APIContract, Archive: sources.Runtime.Name, SHA256: actual,
		InstalledAt: time.Now().UTC().Format(time.RFC3339),
	}); err != nil {
		return result, err
	}
	result.Status = "installed"
	result.Installed = true
	result.GOAPIPath = filepath.Join(request.Root, "bin", "goapi")
	result.LibraryPath = filepath.Join(request.Root, "lib")
	emit(taskEvent{Kind: eventDone, Title: "runtime 준비 완료", Detail: sources.Channel.Version})
	return result, nil
}

func runtimeContextError(ctx context.Context) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("runtime 준비를 취소했습니다: %w", err)
	}
	return nil
}

func fetchExpectedChecksum(ctx context.Context, client *http.Client, url, name, label string) (string, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	request.Header.Set("User-Agent", "nubo/"+version)
	response, err := client.Do(request)
	if err != nil {
		return "", fmt.Errorf("%s checksum을 내려받지 못했습니다: %w", label, err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%s checksum 응답이 올바르지 않습니다: HTTP %d", label, response.StatusCode)
	}
	content, err := io.ReadAll(io.LimitReader(response.Body, 16<<10))
	if err != nil {
		return "", err
	}
	for _, line := range strings.Split(string(content), "\n") {
		fields := strings.Fields(line)
		if len(fields) == 2 && strings.TrimPrefix(fields[1], "*") == name && len(fields[0]) == 64 {
			if _, err := hex.DecodeString(fields[0]); err == nil {
				return strings.ToLower(fields[0]), nil
			}
		}
	}
	return "", fmt.Errorf("%s checksum을 찾을 수 없습니다", name)
}

func fetchFile(ctx context.Context, client *http.Client, url, destination string, maxBytes int64, label, progressTitle string, emit func(taskEvent)) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	request.Header.Set("User-Agent", "nubo/"+version)
	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("%s 다운로드에 실패했습니다: %w", label, err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("%s 응답이 올바르지 않습니다: HTTP %d", label, response.StatusCode)
	}
	if response.ContentLength > maxBytes {
		return fmt.Errorf("%s 파일이 허용 크기를 초과합니다", label)
	}
	temporary, err := os.CreateTemp(filepath.Dir(destination), ".download-*.part")
	if err != nil {
		return err
	}
	temporaryPath := temporary.Name()
	defer os.Remove(temporaryPath)
	reader := &progressReader{reader: io.LimitReader(response.Body, maxBytes+1), total: response.ContentLength, title: progressTitle, emit: emit}
	written, copyErr := io.Copy(temporary, reader)
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
	if written > maxBytes {
		return fmt.Errorf("%s 파일이 허용 크기를 초과합니다", label)
	}
	if err := os.Chmod(temporaryPath, 0644); err != nil {
		return err
	}
	return os.Rename(temporaryPath, destination)
}

type progressReader struct {
	reader io.Reader
	total  int64
	read   int64
	emit   func(taskEvent)
	last   int64
	title  string
}

func (reader *progressReader) Read(buffer []byte) (int, error) {
	count, err := reader.reader.Read(buffer)
	reader.read += int64(count)
	if reader.total > 0 {
		percent := reader.read * 100 / reader.total
		if percent != reader.last {
			reader.last = percent
			reader.emit(taskEvent{Kind: eventProgress, Title: reader.title, Current: reader.read, Total: reader.total})
		}
	}
	return count, err
}

func fileSHA256(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}

func runtimeTargetsExist(root string) bool {
	for _, path := range []string{"bin/goapi", "lib", "licenses/sharp-libvips"} {
		if _, err := os.Lstat(filepath.Join(root, filepath.FromSlash(path))); err == nil {
			return true
		}
	}
	return false
}

func writeJSONAtomic(path string, value any, mode os.FileMode) error {
	content, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	content = append(content, '\n')
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	temporary, err := os.CreateTemp(filepath.Dir(path), ".receipt-*")
	if err != nil {
		return err
	}
	temporaryPath := temporary.Name()
	defer os.Remove(temporaryPath)
	if _, err := temporary.Write(content); err != nil {
		temporary.Close()
		return err
	}
	if err := temporary.Close(); err != nil {
		return err
	}
	if err := os.Chmod(temporaryPath, mode); err != nil {
		return err
	}
	return os.Rename(temporaryPath, path)
}

func printRuntimeResult(writer io.Writer, result runtimeResult, color bool) {
	styles := newPalette(color)
	fmt.Fprintln(writer)
	fmt.Fprintln(writer, render(styles.success, "✓ NUBO runtime 준비 완료"))
	fmt.Fprintf(writer, "  NUBO %s · API contract v%s\n", result.Version, result.APIContract)
	fmt.Fprintf(writer, "  GOAPI %s\n", shortCommit(result.GOAPICommit))
	if result.MigrationRequired {
		fmt.Fprintln(writer, render(styles.error, "  DB migration 필요 · 외부 백업 뒤 ./bin/goapi install"))
	} else {
		fmt.Fprintln(writer, render(styles.success, "  DB migration 없음"))
	}
	if !result.Installed {
		fmt.Fprintln(writer, render(styles.muted, "  dry-run이므로 runtime 설치 경로는 변경하지 않았습니다."))
		return
	}
	fmt.Fprintf(writer, "  %s\n", result.GOAPIPath)
	fmt.Fprintf(writer, "  %s\n\n", result.LibraryPath)
	fmt.Fprintln(writer, render(styles.heading, "NUBO가 자동으로 하지 않은 작업"))
	step := 1
	if result.MigrationRequired {
		fmt.Fprintf(writer, "  %d. 데이터베이스·업로드 외부 백업 확인\n", step)
		step++
		fmt.Fprintf(writer, "  %d. ./bin/goapi install\n", step)
		step++
	}
	fmt.Fprintf(writer, "  %d. npm run build\n", step)
	step++
	fmt.Fprintf(writer, "  %d. 사용 중인 tmux 또는 PM2 방식으로 프로세스 재시작\n", step)
}

func shortCommit(value string) string {
	if len(value) > 12 {
		return value[:12]
	}
	return value
}
