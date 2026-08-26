package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestUpdateSkinReplacesOnlyUnchangedInstall(t *testing.T) {
	archive := skinTestArchive(t, map[string]string{
		"nubo-gallery/skin.json": `{"key":"nubo-gallery","version":"1.1.0"}`,
		"nubo-gallery/Home.vue":  `<template>new</template>`,
	})
	server := skinTestServer(t, archive, "nubo-gallery", "1.1.0")
	defer server.Close()
	root, destination := skinTestReceipt(t)
	var output bytes.Buffer
	options := skinRegistryOptions{action: "update", registry: server.URL, key: "nubo-gallery", source: root}
	if err := updateSkin(t.Context(), server.Client(), options, &output); err != nil {
		t.Fatal(err)
	}
	contents, err := os.ReadFile(filepath.Join(destination, "Home.vue"))
	if err != nil || string(contents) != `<template>new</template>` {
		t.Fatalf("updated file = %q, %v", contents, err)
	}
	receipt, err := readSkinReceipt(destination, "nubo-gallery")
	if err != nil || receipt.Version != "1.1.0" || !strings.Contains(output.String(), "UPDATE COMPLETE") {
		t.Fatalf("updated receipt/output = %+v, %v / %s", receipt, err, output.String())
	}
}

func TestUpdateSkinRejectsModifiedInstall(t *testing.T) {
	root, destination := skinTestReceipt(t)
	if err := os.WriteFile(filepath.Join(destination, "Home.vue"), []byte("operator change"), 0644); err != nil {
		t.Fatal(err)
	}
	err := updateSkin(t.Context(), http.DefaultClient, skinRegistryOptions{action: "update", key: "nubo-gallery", source: root}, &bytes.Buffer{})
	if err == nil || !strings.Contains(err.Error(), "fork") {
		t.Fatalf("expected modified install refusal, got %v", err)
	}
}

func TestUpdateSkinDryRunKeepsCurrentFiles(t *testing.T) {
	archive := skinTestArchive(t, map[string]string{
		"nubo-gallery/skin.json": `{"key":"nubo-gallery","version":"1.1.0"}`,
		"nubo-gallery/Home.vue":  `<template>new</template>`,
	})
	server := skinTestServer(t, archive, "nubo-gallery", "1.1.0")
	defer server.Close()
	root, destination := skinTestReceipt(t)
	var output bytes.Buffer
	options := skinRegistryOptions{action: "update", registry: server.URL, key: "nubo-gallery", source: root, dryRun: true}
	if err := updateSkin(t.Context(), server.Client(), options, &output); err != nil {
		t.Fatal(err)
	}
	contents, err := os.ReadFile(filepath.Join(destination, "Home.vue"))
	if err != nil || string(contents) != "<template />" || !strings.Contains(output.String(), "UPDATE PREVIEW") {
		t.Fatalf("dry-run changed files: %q, %v / %s", contents, err, output.String())
	}
}

func TestUpdateSkinStopsWhenFilesChangeDuringDownload(t *testing.T) {
	archive := skinTestArchive(t, map[string]string{
		"nubo-gallery/skin.json": `{"key":"nubo-gallery","version":"1.1.0"}`,
		"nubo-gallery/Home.vue":  `<template>new</template>`,
	})
	hash := sha256.Sum256(archive)
	root, destination := skinTestReceipt(t)
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if strings.HasSuffix(request.URL.Path, "/download") {
			if err := os.WriteFile(filepath.Join(destination, "Home.vue"), []byte("concurrent change"), 0644); err != nil {
				t.Error(err)
			}
			_, _ = response.Write(archive)
			return
		}
		fmt.Fprintf(response, `{"key":"nubo-gallery","name":"Test","version":"1.1.0","min_nubo_version":"1.0.0","sha256":%q,"size_bytes":%d,"download_url":%q}`,
			hex.EncodeToString(hash[:]), len(archive), server.URL+"/download")
	}))
	defer server.Close()
	options := skinRegistryOptions{action: "update", registry: server.URL, key: "nubo-gallery", source: root}
	err := updateSkin(t.Context(), server.Client(), options, &bytes.Buffer{})
	if err == nil || !strings.Contains(err.Error(), "준비 중 로컬 파일이 바뀌어") {
		t.Fatalf("expected concurrent change refusal, got %v", err)
	}
	contents, readErr := os.ReadFile(filepath.Join(destination, "Home.vue"))
	if readErr != nil || string(contents) != "concurrent change" {
		t.Fatalf("concurrent change was overwritten: %q, %v", contents, readErr)
	}
}

func TestDiffSkinReportsLocalChanges(t *testing.T) {
	root, destination := skinTestReceipt(t)
	if err := os.WriteFile(filepath.Join(destination, "Home.vue"), []byte("changed"), 0644); err != nil {
		t.Fatal(err)
	}
	var output bytes.Buffer
	if err := diffSkin(skinRegistryOptions{action: "diff", key: "nubo-gallery", source: root}, &output); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(output.String(), "LOCAL CHANGES") || !strings.Contains(output.String(), "Home.vue") {
		t.Fatalf("unexpected diff output: %s", output.String())
	}
}

func TestForkSkinDetachesModifiedInstall(t *testing.T) {
	root, destination := skinTestReceipt(t)
	if err := os.WriteFile(filepath.Join(destination, "Home.vue"), []byte("operator change"), 0644); err != nil {
		t.Fatal(err)
	}
	var output bytes.Buffer
	options := skinRegistryOptions{action: "fork", key: "nubo-gallery", forkKey: "my-gallery", source: root}
	if err := forkSkin(options, &output); err != nil {
		t.Fatal(err)
	}
	forked := filepath.Join(root, "app", "skins", "my-gallery")
	manifest, err := os.ReadFile(filepath.Join(forked, "skin.json"))
	if err != nil || !strings.Contains(string(manifest), `"key": "my-gallery"`) || !strings.Contains(string(manifest), `"derived_from"`) {
		t.Fatalf("fork manifest = %s, %v", manifest, err)
	}
	if _, err := os.Stat(filepath.Join(forked, skinReceiptName)); !os.IsNotExist(err) {
		t.Fatal("fork kept Market receipt")
	}
	contents, err := os.ReadFile(filepath.Join(forked, "Home.vue"))
	if err != nil || string(contents) != "operator change" || !strings.Contains(output.String(), "FORK COMPLETE") {
		t.Fatalf("forked source = %q, %v / %s", contents, err, output.String())
	}
}

func TestForkSkinRejectsLinks(t *testing.T) {
	root, destination := skinTestReceipt(t)
	if err := os.Symlink(filepath.Join(root, "package.json"), filepath.Join(destination, "linked.json")); err != nil {
		t.Fatal(err)
	}
	options := skinRegistryOptions{action: "fork", key: "nubo-gallery", forkKey: "my-gallery", source: root}
	err := forkSkin(options, &bytes.Buffer{})
	if err == nil || !strings.Contains(err.Error(), "링크를 포함할 수 없습니다") {
		t.Fatalf("expected link refusal, got %v", err)
	}
}

func skinTestSource(t *testing.T, version string) string {
	t.Helper()
	root := t.TempDir()
	for _, directory := range []string{filepath.Join(root, "app", "skins"), filepath.Join(root, "deploy")} {
		if err := os.MkdirAll(directory, 0755); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(root, "package.json"), []byte(`{"name":"nubo"}`), 0644); err != nil {
		t.Fatal(err)
	}
	sources := fmt.Sprintf(`{"channel":{"version":%q}}`, version)
	if err := os.WriteFile(filepath.Join(root, "deploy", "release-sources.json"), []byte(sources), 0644); err != nil {
		t.Fatal(err)
	}
	return root
}

func skinTestReceipt(t *testing.T) (string, string) {
	t.Helper()
	root := skinTestSource(t, "1.2.21")
	destination := filepath.Join(root, "app", "skins", "nubo-gallery")
	if err := os.Mkdir(destination, 0755); err != nil {
		t.Fatal(err)
	}
	files := []skinReceiptFile{}
	for name, body := range map[string]string{"skin.json": `{"key":"nubo-gallery"}`, "Home.vue": "<template />"} {
		filename := filepath.Join(destination, name)
		if err := os.WriteFile(filename, []byte(body), 0644); err != nil {
			t.Fatal(err)
		}
		checksum, err := fileSHA256(filename)
		if err != nil {
			t.Fatal(err)
		}
		files = append(files, skinReceiptFile{Path: name, SHA256: checksum})
	}
	item := registrySkin{Key: "nubo-gallery", Version: "1.0.0", SHA256: strings.Repeat("a", 64)}
	if err := writeSkinReceipt(destination, item, files); err != nil {
		t.Fatal(err)
	}
	return root, destination
}

func skinTestArchive(t *testing.T, files map[string]string) []byte {
	t.Helper()
	var archive bytes.Buffer
	gz := gzip.NewWriter(&archive)
	writer := tar.NewWriter(gz)
	for name, body := range files {
		if err := writer.WriteHeader(&tar.Header{Name: name, Mode: 0644, Size: int64(len(body)), Typeflag: tar.TypeReg}); err != nil {
			t.Fatal(err)
		}
		if _, err := writer.Write([]byte(body)); err != nil {
			t.Fatal(err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	if err := gz.Close(); err != nil {
		t.Fatal(err)
	}
	return archive.Bytes()
}

func skinTestServer(t *testing.T, archive []byte, key, version string) *httptest.Server {
	t.Helper()
	hash := sha256.Sum256(archive)
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if strings.HasSuffix(request.URL.Path, "/download") {
			_, _ = response.Write(archive)
			return
		}
		fmt.Fprintf(response, `{"key":%q,"name":"Test","version":%q,"min_nubo_version":"1.0.0","sha256":%q,"size_bytes":%d,"download_url":%q}`,
			key, version, hex.EncodeToString(hash[:]), len(archive), server.URL+"/download")
	}))
	return server
}
