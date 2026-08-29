package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
)

func TestUpdateCLIAtomicallyReplacesOnlyCLI(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	destination := filepath.Join(root, ".nubo", "bin", "nubo")
	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(destination, []byte("old-cli"), 0755); err != nil {
		t.Fatal(err)
	}
	binary := []byte("new-official-cli")
	server := cliServer(t, sources, binary, binary)
	defer server.Close()
	verified := false
	result, err := updateCLI(context.Background(), cliUpdateRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(),
		VerifyBinary: func(_ context.Context, path, targetVersion string) error {
			content, readErr := os.ReadFile(path)
			verified = readErr == nil && string(content) == string(binary) && targetVersion == "1.3.1"
			return readErr
		},
	}, func(taskEvent) {})
	if err != nil {
		t.Fatal(err)
	}
	if !result.Updated || result.Status != "updated" || !verified {
		t.Fatalf("result=%+v verified=%v", result, verified)
	}
	content, err := os.ReadFile(destination)
	if err != nil || string(content) != string(binary) {
		t.Fatalf("CLI=%q, %v", content, err)
	}
	if _, err := os.Stat(filepath.Join(root, "bin", "goapi")); !os.IsNotExist(err) {
		t.Fatalf("update changed runtime path: %v", err)
	}
}

func TestUpdateCLIDryRunPreservesCurrentBinary(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	destination := filepath.Join(root, ".nubo", "bin", "nubo")
	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(destination, []byte("old-cli"), 0755); err != nil {
		t.Fatal(err)
	}
	binary := []byte("new-official-cli")
	server := cliServer(t, sources, binary, binary)
	defer server.Close()
	result, err := updateCLI(context.Background(), cliUpdateRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(), DryRun: true,
		VerifyBinary: func(context.Context, string, string) error { return nil },
	}, func(taskEvent) {})
	if err != nil {
		t.Fatal(err)
	}
	if result.Updated || result.Status != "dry-run" {
		t.Fatalf("result=%+v", result)
	}
	content, _ := os.ReadFile(destination)
	if string(content) != "old-cli" {
		t.Fatalf("dry-run changed CLI: %q", content)
	}
}

func TestUpdateCLICurrentChecksumSkipsAssetDownload(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	destination := filepath.Join(root, ".nubo", "bin", "nubo")
	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		t.Fatal(err)
	}
	binary := []byte("current-official-cli")
	if err := os.WriteFile(destination, binary, 0755); err != nil {
		t.Fatal(err)
	}
	var assetRequests atomic.Int32
	server := cliServerWithCounter(t, sources, binary, binary, &assetRequests)
	defer server.Close()
	result, err := updateCLI(context.Background(), cliUpdateRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(),
		VerifyBinary: func(context.Context, string, string) error {
			t.Fatal("current CLI must not be staged")
			return nil
		},
	}, func(taskEvent) {})
	if err != nil {
		t.Fatal(err)
	}
	if result.Status != "current" || result.Updated || assetRequests.Load() != 0 {
		t.Fatalf("result=%+v assetRequests=%d", result, assetRequests.Load())
	}
}

func TestUpdateCLIRejectsChecksumMismatchAndPreservesCurrent(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	destination := filepath.Join(root, ".nubo", "bin", "nubo")
	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(destination, []byte("old-cli"), 0755); err != nil {
		t.Fatal(err)
	}
	server := cliServer(t, sources, []byte("served-corrupt-cli"), []byte("expected-cli"))
	defer server.Close()
	_, err := updateCLI(context.Background(), cliUpdateRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(),
		VerifyBinary: func(context.Context, string, string) error { return nil },
	}, func(taskEvent) {})
	if err == nil || !strings.Contains(err.Error(), "SHA-256") {
		t.Fatalf("expected checksum error, got %v", err)
	}
	content, _ := os.ReadFile(destination)
	if string(content) != "old-cli" {
		t.Fatalf("checksum failure changed CLI: %q", content)
	}
}

func TestUpdateCLICancellationBeforeRenamePreservesCurrent(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	destination := filepath.Join(root, ".nubo", "bin", "nubo")
	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(destination, []byte("old-cli"), 0755); err != nil {
		t.Fatal(err)
	}
	binary := []byte("new-official-cli")
	server := cliServer(t, sources, binary, binary)
	defer server.Close()
	ctx, cancel := context.WithCancel(context.Background())
	_, err := updateCLI(ctx, cliUpdateRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(),
		VerifyBinary: func(context.Context, string, string) error { return nil },
	}, func(event taskEvent) {
		if event.Title == "CLI 실행 파일 검증" {
			cancel()
		}
	})
	if err == nil || !strings.Contains(err.Error(), "취소") {
		t.Fatalf("expected cancellation, got %v", err)
	}
	content, _ := os.ReadFile(destination)
	if string(content) != "old-cli" {
		t.Fatalf("cancel changed CLI: %q", content)
	}
}

func TestUpdateCLIVerificationFailurePreservesCurrent(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	destination := filepath.Join(root, ".nubo", "bin", "nubo")
	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(destination, []byte("old-cli"), 0755); err != nil {
		t.Fatal(err)
	}
	binary := []byte("new-official-cli")
	server := cliServer(t, sources, binary, binary)
	defer server.Close()
	_, err := updateCLI(context.Background(), cliUpdateRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(),
		VerifyBinary: func(context.Context, string, string) error {
			return errors.New("version mismatch")
		},
	}, func(taskEvent) {})
	if err == nil || !strings.Contains(err.Error(), "version mismatch") {
		t.Fatalf("expected verifier error, got %v", err)
	}
	content, _ := os.ReadFile(destination)
	if string(content) != "old-cli" {
		t.Fatalf("verification failure changed CLI: %q", content)
	}
}

func TestVerifyCLIBinaryRejectsNonELF(t *testing.T) {
	path := filepath.Join(t.TempDir(), "nubo")
	if err := os.WriteFile(path, []byte("#!/bin/sh\necho nubo 1.3.1\n"), 0755); err != nil {
		t.Fatal(err)
	}
	err := verifyCLIBinary(context.Background(), path, "1.3.1")
	if err == nil || !strings.Contains(err.Error(), "ELF") {
		t.Fatalf("expected ELF error, got %v", err)
	}
}

func cliServer(t *testing.T, sources releaseSources, servedBinary, checksumBinary []byte) *httptest.Server {
	t.Helper()
	return cliServerWithCounter(t, sources, servedBinary, checksumBinary, nil)
}

func cliServerWithCounter(t *testing.T, sources releaseSources, servedBinary, checksumBinary []byte, assetRequests *atomic.Int32) *httptest.Server {
	t.Helper()
	hash := sha256.Sum256(checksumBinary)
	checksum := hex.EncodeToString(hash[:]) + "  " + sources.CLI.Name + "\n"
	return httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case "/" + sources.CLI.Name:
			if assetRequests != nil {
				assetRequests.Add(1)
			}
			_, _ = writer.Write(servedBinary)
		case "/" + sources.CLI.Checksum:
			_, _ = writer.Write([]byte(checksum))
		default:
			http.NotFound(writer, request)
		}
	}))
}
