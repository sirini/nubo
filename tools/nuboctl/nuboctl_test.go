package main

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type fakeRunner struct {
	paths   map[string]bool
	outputs map[string]string
	errors  map[string]error
}

func (runner fakeRunner) lookPath(name string) (string, error) {
	if runner.paths[name] {
		return "/usr/bin/" + name, nil
	}
	return "", errors.New("not found")
}

func (runner fakeRunner) run(name string, args ...string) (string, error) {
	key := strings.Join(append([]string{name}, args...), " ")
	return runner.outputs[key], runner.errors[key]
}

func TestReadEnvironmentAndRuntimePaths(t *testing.T) {
	root := t.TempDir()
	environmentPath := filepath.Join(root, "nubo.env")
	contents := strings.Join([]string{
		"# 주석",
		"GOAPI_HOST=127.0.0.1",
		"GOAPI_PORT=3006",
		"NITRO_HOST=localhost",
		"NITRO_PORT=3000",
		"NUBO_UPLOAD_DIR=../legacy/upload",
		"GOAPI_TITLE=\"테스트 사이트\"",
	}, "\n")
	if err := os.WriteFile(environmentPath, []byte(contents), 0600); err != nil {
		t.Fatal(err)
	}

	values, err := readEnvironment(environmentPath)
	if err != nil {
		t.Fatal(err)
	}
	if values["GOAPI_TITLE"] != "테스트 사이트" {
		t.Fatalf("title = %q", values["GOAPI_TITLE"])
	}
	options := options{stateDir: filepath.Join(root, "state")}
	wantUpload := filepath.Join(root, "legacy", "upload")
	if got := uploadDirectory(options, values); got != wantUpload {
		t.Fatalf("upload directory = %q, want %q", got, wantUpload)
	}
	if got := webBaseURL(options, values); got != "http://localhost:3000" {
		t.Fatalf("web URL = %q", got)
	}
}

func TestCheckNodeEnforcesSupportedRange(t *testing.T) {
	runner := fakeRunner{
		paths:   map[string]bool{"node": true},
		outputs: map[string]string{"node --version": "v26.7.0\n"},
		errors:  map[string]error{},
	}
	if result := checkNode(runner); result.level != levelPass {
		t.Fatalf("supported Node result = %+v", result)
	}

	runner.outputs["node --version"] = "v24.10.0\n"
	if result := checkNode(runner); result.level != levelFail {
		t.Fatalf("old Node result = %+v", result)
	}
}

func TestVerifyReleaseChecksums(t *testing.T) {
	releaseDir := t.TempDir()
	filePath := filepath.Join(releaseDir, "share", "env.sample")
	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filePath, []byte("NUBO\n"), 0644); err != nil {
		t.Fatal(err)
	}
	hash, err := fileSHA256(filePath)
	if err != nil {
		t.Fatal(err)
	}
	checksums := fmt.Sprintf("%s  ./share/env.sample\n", hash)
	if err := os.WriteFile(filepath.Join(releaseDir, "checksums.txt"), []byte(checksums), 0644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filePath, []byte("changed\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err == nil {
		t.Fatal("변경된 파일의 checksum 검증이 성공했습니다")
	}
}

func TestVerifyReleaseChecksumsRejectsTraversal(t *testing.T) {
	releaseDir := t.TempDir()
	line := strings.Repeat("0", 64) + "  ./../outside\n"
	if err := os.WriteFile(filepath.Join(releaseDir, "checksums.txt"), []byte(line), 0644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err == nil {
		t.Fatal("릴리스 밖 checksum 경로를 허용했습니다")
	}
}

func TestVerifyReleaseChecksumsRejectsEscapingSymlink(t *testing.T) {
	releaseDir := t.TempDir()
	filePath := filepath.Join(releaseDir, "manifest.json")
	if err := os.WriteFile(filePath, []byte("{}\n"), 0644); err != nil {
		t.Fatal(err)
	}
	outside := filepath.Join(t.TempDir(), "outside")
	if err := os.WriteFile(outside, []byte("outside\n"), 0644); err != nil {
		t.Fatal(err)
	}
	linkPath := filepath.Join(releaseDir, "link")
	if err := os.Symlink(outside, linkPath); err != nil {
		t.Fatal(err)
	}
	hash, err := fileSHA256(filePath)
	if err != nil {
		t.Fatal(err)
	}
	line := fmt.Sprintf("%s  ./manifest.json\n", hash)
	if err := os.WriteFile(filepath.Join(releaseDir, "checksums.txt"), []byte(line), 0644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err == nil {
		t.Fatal("릴리스 밖 심볼릭 링크를 허용했습니다")
	}
}

func TestVerifyReleaseChecksumsRejectsUnlistedFile(t *testing.T) {
	releaseDir := t.TempDir()
	filePath := filepath.Join(releaseDir, "manifest.json")
	if err := os.WriteFile(filePath, []byte("{}\n"), 0644); err != nil {
		t.Fatal(err)
	}
	hash, err := fileSHA256(filePath)
	if err != nil {
		t.Fatal(err)
	}
	line := fmt.Sprintf("%s  ./manifest.json\n", hash)
	if err := os.WriteFile(filepath.Join(releaseDir, "checksums.txt"), []byte(line), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(releaseDir, "unexpected"), []byte("unexpected\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err == nil {
		t.Fatal("checksum 목록에 없는 파일을 허용했습니다")
	}
}

func TestCheckHTTPRequiresHealthyJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("content-type", "application/json")
		if request.URL.Path == "/ready" {
			response.WriteHeader(http.StatusServiceUnavailable)
			_, _ = response.Write([]byte(`{"status":"unavailable"}`))
			return
		}
		_, _ = response.Write([]byte(`{"status":"ok"}`))
	}))
	defer server.Close()

	if result := checkHTTP(server.URL + "/health"); result.level != levelPass {
		t.Fatalf("health result = %+v", result)
	}
	if result := checkHTTP(server.URL + "/ready"); result.level != levelFail {
		t.Fatalf("readiness result = %+v", result)
	}
}

func TestIsLoopbackHost(t *testing.T) {
	for _, host := range []string{"localhost", "127.0.0.1", "::1", "[::1]"} {
		if !isLoopbackHost(host) {
			t.Fatalf("%q should be loopback", host)
		}
	}
	if isLoopbackHost("0.0.0.0") {
		t.Fatal("0.0.0.0 should not be loopback")
	}
}
