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
	remove, err := parseSkinRegistryOptions([]string{"remove", "nubo-gallery", "--dry-run", "--source", "/tmp/source"})
	if err != nil || remove.key != "nubo-gallery" || !remove.dryRun {
		t.Fatalf("unexpected remove options: %+v / %v", remove, err)
	}
	if _, err = parseSkinRegistryOptions([]string{"search", "--dry-run"}); err == nil {
		t.Fatal("search accepted --dry-run")
	}
	update, err := parseSkinRegistryOptions([]string{"update", "nubo-gallery", "--version", "1.3.0", "--dry-run"})
	if err != nil || update.key != "nubo-gallery" || update.version != "1.3.0" || !update.dryRun {
		t.Fatalf("unexpected update options: %+v / %v", update, err)
	}
	fork, err := parseSkinRegistryOptions([]string{"fork", "nubo-gallery", "my-gallery", "--source", "/tmp/source"})
	if err != nil || fork.key != "nubo-gallery" || fork.forkKey != "my-gallery" || fork.source != "/tmp/source" {
		t.Fatalf("unexpected fork options: %+v / %v", fork, err)
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

func TestMarketCellUsesTerminalDisplayWidth(t *testing.T) {
	for _, test := range []struct {
		value, expected string
		width           int
	}{
		{value: "Gallery", width: 10, expected: "Gallery   "},
		{value: "기본 스킨", width: 11, expected: "기본 스킨  "},
		{value: "기본 게시판 및 갤러리 스킨", width: 22, expected: "기본 게시판 및 갤러리…"},
		{value: "기본 로그인 및 회원가입 스킨", width: 26, expected: "기본 로그인 및 회원가입…  "},
	} {
		if actual := marketCell(test.value, test.width); actual != test.expected {
			t.Errorf("marketCell(%q, %d) = %q, want %q", test.value, test.width, actual, test.expected)
		}
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
	if !strings.Contains(string(contents), "gallery") || !strings.Contains(output.String(), "INSTALL COMPLETE") || !strings.Contains(output.String(), "npm run build") {
		t.Fatalf("unexpected installation: %s / %s", contents, output.String())
	}
	receipt, err := readSkinReceipt(filepath.Join(root, "app", "skins", "nubo-gallery"), "nubo-gallery")
	if err != nil || receipt.Version != "1.0.0" || len(receipt.Files) != 2 {
		t.Fatalf("unexpected install receipt: %+v / %v", receipt, err)
	}
	if err = installSkin(t.Context(), server.Client(), skinRegistryOptions{action: "install", registry: server.URL, key: "nubo-gallery", source: root}, &output); err == nil || !strings.Contains(err.Error(), "이미 설치") {
		t.Fatalf("expected overwrite refusal, got %v", err)
	}
}

func TestRemoveSkinPreviewsAndDeletesUnchangedInstall(t *testing.T) {
	root, destination := skinTestReceipt(t)
	var output bytes.Buffer
	options := skinRegistryOptions{action: "remove", key: "nubo-gallery", source: root, dryRun: true}
	if err := removeSkin(options, &output); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(destination); err != nil || !strings.Contains(output.String(), "REMOVE PREVIEW") {
		t.Fatalf("dry-run changed skin or omitted preview: %v / %s", err, output.String())
	}
	output.Reset()
	options.dryRun = false
	if err := removeSkin(options, &output); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(destination); !os.IsNotExist(err) || !strings.Contains(output.String(), "삭제 완료") || !strings.Contains(output.String(), "npm run build") {
		t.Fatalf("skin was not removed safely: %v / %s", err, output.String())
	}
}

func TestRemoveSkinRejectsChangedAndUntrackedFiles(t *testing.T) {
	for _, test := range []struct {
		name   string
		change func(string) error
		want   string
	}{
		{name: "modified", change: func(destination string) error {
			return os.WriteFile(filepath.Join(destination, "Home.vue"), []byte("changed"), 0644)
		}, want: "checksum 변경됨"},
		{name: "added", change: func(destination string) error {
			return os.WriteFile(filepath.Join(destination, "note.txt"), []byte("keep"), 0644)
		}, want: "설치 영수증에 없는 파일"},
		{name: "missing", change: func(destination string) error {
			return os.Remove(filepath.Join(destination, "Home.vue"))
		}, want: "파일 누락"},
	} {
		t.Run(test.name, func(t *testing.T) {
			root, destination := skinTestReceipt(t)
			if err := test.change(destination); err != nil {
				t.Fatal(err)
			}
			err := removeSkin(skinRegistryOptions{key: "nubo-gallery", source: root}, &bytes.Buffer{})
			if err == nil || !strings.Contains(err.Error(), test.want) {
				t.Fatalf("expected %q refusal, got %v", test.want, err)
			}
			if _, statErr := os.Stat(destination); statErr != nil {
				t.Fatalf("refused skin was changed: %v", statErr)
			}
		})
	}
}

func TestRemoveSkinRejectsFolderWithoutReceipt(t *testing.T) {
	root := skinTestSource(t, "1.2.21")
	destination := filepath.Join(root, "app", "skins", "nubo-gallery")
	if err := os.Mkdir(destination, 0755); err != nil {
		t.Fatal(err)
	}
	err := removeSkin(skinRegistryOptions{key: "nubo-gallery", source: root}, &bytes.Buffer{})
	if err == nil || !strings.Contains(err.Error(), "설치 영수증이 없어") {
		t.Fatalf("expected missing receipt refusal, got %v", err)
	}
}

func TestRemoveSkinRejectsSymlinkAndDamagedReceipt(t *testing.T) {
	root, destination := skinTestReceipt(t)
	if err := os.Remove(filepath.Join(destination, "Home.vue")); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(filepath.Join(root, "package.json"), filepath.Join(destination, "Home.vue")); err != nil {
		t.Fatal(err)
	}
	err := removeSkin(skinRegistryOptions{key: "nubo-gallery", source: root}, &bytes.Buffer{})
	if err == nil || !strings.Contains(err.Error(), "일반 파일이 아님") {
		t.Fatalf("expected symlink refusal, got %v", err)
	}
	if _, statErr := os.Lstat(destination); statErr != nil {
		t.Fatalf("refused skin was changed: %v", statErr)
	}

	root, destination = skinTestReceipt(t)
	if err := os.WriteFile(filepath.Join(destination, skinReceiptName), []byte("not-json"), 0644); err != nil {
		t.Fatal(err)
	}
	err = removeSkin(skinRegistryOptions{key: "nubo-gallery", source: root}, &bytes.Buffer{})
	if err == nil || !strings.Contains(err.Error(), "영수증이 손상") {
		t.Fatalf("expected damaged receipt refusal, got %v", err)
	}
	if _, statErr := os.Stat(destination); statErr != nil {
		t.Fatalf("refused skin was changed: %v", statErr)
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

func TestExtractSkinPackageRejectsReservedReceipt(t *testing.T) {
	directory := t.TempDir()
	filename := filepath.Join(directory, "bad.tar.gz")
	archive := skinTestArchive(t, map[string]string{
		"nubo-test/skin.json":         `{"key":"nubo-test","version":"1.0.0"}`,
		"nubo-test/.nubo-market.json": `{}`,
	})
	if err := os.WriteFile(filename, archive, 0644); err != nil {
		t.Fatal(err)
	}
	skins := filepath.Join(directory, "skins")
	if err := os.Mkdir(skins, 0755); err != nil {
		t.Fatal(err)
	}
	err := extractSkinPackage(filename, skins, registrySkin{Key: "nubo-test", Version: "1.0.0"})
	if err == nil || !strings.Contains(err.Error(), "예약 파일") {
		t.Fatalf("expected reserved receipt refusal, got %v", err)
	}
}
