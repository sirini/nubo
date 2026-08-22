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

func TestParseSkinRegistryOptions(t *testing.T) {
	options, err := parseSkinRegistryOptions([]string{"install", "nubo-gallery", "--version", "1.2.0", "--registry", "https://example.com/market/"})
	if err != nil {
		t.Fatal(err)
	}
	if options.key != "nubo-gallery" || options.version != "1.2.0" || options.registry != "https://example.com/market" {
		t.Fatalf("unexpected options: %+v", options)
	}
	if _, err = parseSkinRegistryOptions([]string{"install", "../escape"}); err == nil {
		t.Fatal("unsafe key was accepted")
	}
}

func TestSearchSkins(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.URL.Query().Get("q") != "gallery" {
			t.Errorf("query = %q", request.URL.RawQuery)
		}
		fmt.Fprint(response, `{"items":[{"key":"nubo-gallery","name":"Gallery","version":"1.0.0","min_nubo_version":"1.2.0"}],"total":1}`)
	}))
	defer server.Close()
	var output bytes.Buffer
	err := searchSkins(t.Context(), server.Client(), skinRegistryOptions{registry: server.URL, query: "gallery"}, &output)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(output.String(), "NUBO MARKET · SEARCH · gallery") || !strings.Contains(output.String(), "nubo-gallery") || !strings.Contains(output.String(), "스킨 1개") {
		t.Fatalf("unexpected output: %s", output.String())
	}
}

func TestShowSkinUsesReadableSections(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
		fmt.Fprint(response, `{"key":"nubo-gallery","name":"Gallery","version":"1.0.0","author":"NUBO","description":"gallery skin","features":["다크 모드"],"min_nubo_version":"1.2.0"}`)
	}))
	defer server.Close()
	var output bytes.Buffer
	if err := showSkin(t.Context(), server.Client(), skinRegistryOptions{registry: server.URL, key: "nubo-gallery"}, &output); err != nil {
		t.Fatal(err)
	}
	for _, expected := range []string{"NUBO MARKET · SKIN", "VERSION", "FEATURES", "DESCRIPTION"} {
		if !strings.Contains(output.String(), expected) {
			t.Fatalf("missing %q in output: %s", expected, output.String())
		}
	}
}

func TestInstallSkinVerifiesAndExtractsPackage(t *testing.T) {
	archive := skinTestArchive(t, map[string]string{
		"nubo-gallery/skin.json": `{"key":"nubo-gallery","name":"Gallery","version":"1.0.0","author":"NUBO","website":"https://nubohub.org","description":"gallery","preview":"preview.png","features":[],"min_nubo_version":"1.2.0"}`,
		"nubo-gallery/Home.vue":  `<template><main>gallery</main></template>`,
	})
	hash := sha256.Sum256(archive)
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if strings.HasSuffix(request.URL.Path, "/download") {
			response.Write(archive)
			return
		}
		fmt.Fprintf(response, `{"key":"nubo-gallery","name":"Gallery","version":"1.0.0","author":"NUBO","description":"gallery","min_nubo_version":"1.2.0","sha256":"%s","size_bytes":%d,"download_url":"%s/download"}`, hex.EncodeToString(hash[:]), len(archive), server.URL)
	}))
	defer server.Close()
	root := skinTestSource(t, "1.2.19")
	var output bytes.Buffer
	err := installSkin(t.Context(), server.Client(), skinRegistryOptions{action: "install", registry: server.URL, key: "nubo-gallery", source: root}, &output)
	if err != nil {
		t.Fatal(err)
	}
	contents, err := os.ReadFile(filepath.Join(root, "app", "skins", "nubo-gallery", "Home.vue"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(contents), "gallery") || !strings.Contains(output.String(), "INSTALL COMPLETE") || !strings.Contains(output.String(), "nuboctl customize") {
		t.Fatalf("unexpected installation: %s / %s", contents, output.String())
	}
	if err = installSkin(t.Context(), server.Client(), skinRegistryOptions{action: "install", registry: server.URL, key: "nubo-gallery", source: root}, &output); err == nil || !strings.Contains(err.Error(), "이미 설치") {
		t.Fatalf("expected overwrite refusal, got %v", err)
	}
}

func TestInstallSkinRejectsChecksumMismatch(t *testing.T) {
	archive := skinTestArchive(t, map[string]string{"nubo-test/skin.json": `{"key":"nubo-test","version":"1.0.0"}`})
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if strings.HasSuffix(request.URL.Path, "/download") {
			response.Write(archive)
			return
		}
		fmt.Fprintf(response, `{"key":"nubo-test","name":"Test","version":"1.0.0","min_nubo_version":"1.0.0","sha256":"%064d","size_bytes":%d,"download_url":"%s/download"}`, 0, len(archive), server.URL)
	}))
	defer server.Close()
	root := skinTestSource(t, "1.2.19")
	err := installSkin(t.Context(), server.Client(), skinRegistryOptions{action: "install", registry: server.URL, key: "nubo-test", source: root}, &bytes.Buffer{})
	if err == nil || !strings.Contains(err.Error(), "checksum") {
		t.Fatalf("expected checksum error, got %v", err)
	}
}

func TestExtractSkinPackageRejectsTraversal(t *testing.T) {
	directory := t.TempDir()
	filename := filepath.Join(directory, "bad.tar.gz")
	file, err := os.Create(filename)
	if err != nil {
		t.Fatal(err)
	}
	gz := gzip.NewWriter(file)
	writer := tar.NewWriter(gz)
	body := "bad"
	if err = writer.WriteHeader(&tar.Header{Name: "../outside", Mode: 0644, Size: int64(len(body))}); err != nil {
		t.Fatal(err)
	}
	writer.Write([]byte(body))
	writer.Close()
	gz.Close()
	file.Close()
	skins := filepath.Join(directory, "skins")
	os.Mkdir(skins, 0755)
	err = extractSkinPackage(filename, skins, registrySkin{Key: "nubo-test", Version: "1.0.0"})
	if err == nil || !strings.Contains(err.Error(), "안전하지 않은") {
		t.Fatalf("expected traversal error, got %v", err)
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
