package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestExtractRuntimeRejectsPathTraversal(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	var content bytes.Buffer
	compressed := gzip.NewWriter(&content)
	archive := tar.NewWriter(compressed)
	unsafe := strings.TrimSuffix(sources.Runtime.Name, ".tar.gz") + "/../../outside"
	if err := archive.WriteHeader(&tar.Header{Name: unsafe, Mode: 0644, Size: 3, Typeflag: tar.TypeReg}); err != nil {
		t.Fatal(err)
	}
	_, _ = archive.Write([]byte("bad"))
	_ = archive.Close()
	_ = compressed.Close()
	archivePath := filepath.Join(t.TempDir(), sources.Runtime.Name)
	if err := os.WriteFile(archivePath, content.Bytes(), 0644); err != nil {
		t.Fatal(err)
	}
	_, _, err := extractAndVerifyRuntime(archivePath, root, sources)
	if err == nil || !strings.Contains(err.Error(), "경로") {
		t.Fatalf("expected path error, got %v", err)
	}
	if _, err := os.Stat(filepath.Join(root, "outside")); !os.IsNotExist(err) {
		t.Fatalf("archive escaped staging: %v", err)
	}
}

func TestExtractRuntimeRequiresExplicitMigrationContract(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	content := runtimeArchive(t, sources, func(files map[string][]byte) {
		var manifest map[string]any
		if err := json.Unmarshal(files["manifest.json"], &manifest); err != nil {
			t.Fatal(err)
		}
		delete(manifest, "migrationRequired")
		files["manifest.json"], _ = json.Marshal(manifest)
	})
	archivePath := filepath.Join(t.TempDir(), sources.Runtime.Name)
	if err := os.WriteFile(archivePath, content, 0644); err != nil {
		t.Fatal(err)
	}
	_, _, err := extractAndVerifyRuntime(archivePath, root, sources)
	if err == nil || !strings.Contains(err.Error(), "migrationRequired") {
		t.Fatalf("expected migration contract error, got %v", err)
	}
}
