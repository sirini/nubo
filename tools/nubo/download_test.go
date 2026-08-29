package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDownloadRuntimeInstallsPinnedArtifact(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	archive := runtimeArchive(t, sources, nil)
	server := runtimeServer(t, sources, archive)
	defer server.Close()

	result, err := downloadRuntime(context.Background(), runtimeRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(),
	}, func(taskEvent) {})
	if err != nil {
		t.Fatal(err)
	}
	if !result.Installed || result.Status != "installed" {
		t.Fatalf("result = %+v", result)
	}
	content, err := os.ReadFile(filepath.Join(root, "bin", "goapi"))
	if err != nil || string(content) != "new-goapi" {
		t.Fatalf("goapi = %q, %v", content, err)
	}
	if _, err := os.Stat(filepath.Join(root, "lib", "libvips-cpp.so.8.18.3")); err != nil {
		t.Fatal(err)
	}
	receipt, err := readRuntimeReceipt(filepath.Join(root, ".nubo", "runtime.json"))
	if err != nil || receipt.GOAPICommit != sources.GOAPI.Commit {
		t.Fatalf("receipt = %+v, %v", receipt, err)
	}
}

func TestDownloadRuntimeDryRunPreservesWorkspace(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	if err := os.MkdirAll(filepath.Join(root, "bin"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "bin", "goapi"), []byte("old-goapi"), 0755); err != nil {
		t.Fatal(err)
	}
	archive := runtimeArchive(t, sources, nil)
	server := runtimeServer(t, sources, archive)
	defer server.Close()
	result, err := downloadRuntime(context.Background(), runtimeRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(), DryRun: true,
	}, func(taskEvent) {})
	if err != nil {
		t.Fatal(err)
	}
	if result.Installed || result.Status != "dry-run" {
		t.Fatalf("result = %+v", result)
	}
	content, _ := os.ReadFile(filepath.Join(root, "bin", "goapi"))
	if string(content) != "old-goapi" {
		t.Fatalf("dry-run changed goapi: %q", content)
	}
}

func TestDownloadRuntimeRejectsInnerChecksumMismatch(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	archive := runtimeArchiveCustom(t, sources, nil, func(files map[string][]byte) {
		files["bin/goapi"] = []byte("corrupt-after-checksum")
	})
	server := runtimeServer(t, sources, archive)
	defer server.Close()
	_, err := downloadRuntime(context.Background(), runtimeRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(),
	}, func(taskEvent) {})
	if err == nil || !strings.Contains(err.Error(), "checksum") {
		t.Fatalf("expected checksum error, got %v", err)
	}
	if _, err := os.Stat(filepath.Join(root, "bin", "goapi")); !os.IsNotExist(err) {
		t.Fatalf("corrupt runtime was installed: %v", err)
	}
}

func TestDownloadRuntimeCancellationBeforeInstallPreservesWorkspace(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	if err := os.MkdirAll(filepath.Join(root, "bin"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "bin", "goapi"), []byte("old-goapi"), 0755); err != nil {
		t.Fatal(err)
	}
	archive := runtimeArchive(t, sources, nil)
	server := runtimeServer(t, sources, archive)
	defer server.Close()
	ctx, cancel := context.WithCancel(context.Background())
	_, err := downloadRuntime(ctx, runtimeRequest{
		Root: root, Descriptor: sources, BaseURL: server.URL, Client: server.Client(),
	}, func(event taskEvent) {
		if event.Title == "작업 공간에 원자적 배치" {
			cancel()
		}
	})
	if err == nil || !strings.Contains(err.Error(), "취소") {
		t.Fatalf("expected cancellation, got %v", err)
	}
	content, readErr := os.ReadFile(filepath.Join(root, "bin", "goapi"))
	if readErr != nil || string(content) != "old-goapi" {
		t.Fatalf("cancel changed goapi: %q, %v", content, readErr)
	}
}
