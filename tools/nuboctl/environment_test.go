package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// env 구문과 상대 업로드·웹 주소 계산을 함께 검증한다.
func TestReadEnvironmentAndRuntimePaths(t *testing.T) {
	root := t.TempDir()
	environmentPath := filepath.Join(root, "nubo.env")
	contents := strings.Join([]string{
		"# 주석",
		"GOAPI_HOST=127.0.0.1",
		"GOAPI_PORT=3006",
		"NITRO_HOST=localhost",
		"NITRO_PORT=3000",
		"NUXT_APP_BASE_URL=/sample/",
		"NUBO_UPLOAD_DIR=../legacy/upload",
		"GOAPI_TITLE=\"테스트 사이트\"",
	}, "\n")
	if err := os.WriteFile(environmentPath, []byte(contents), 0o600); err != nil {
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
	if got := webBaseURL(options, values); got != "http://localhost:3000/sample" {
		t.Fatalf("web URL = %q", got)
	}
}

// 로컬 수신 주소만 안전한 loopback으로 판정하는지 확인한다.
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

func TestNormalizeAppBaseURL(t *testing.T) {
	for input, expected := range map[string]string{"": "/", "/": "/", "/sample": "/sample/", "/internal//sample/": "/internal/sample/"} {
		actual, err := normalizeAppBaseURL(input)
		if err != nil || actual != expected {
			t.Fatalf("normalizeAppBaseURL(%q) = %q, %v; want %q", input, actual, err, expected)
		}
	}
	for _, input := range []string{"sample", "//sample", "/sample?debug=1", "/sample/../admin"} {
		if _, err := normalizeAppBaseURL(input); err == nil {
			t.Fatalf("normalizeAppBaseURL(%q) should fail", input)
		}
	}
}

// 기존 설정을 다른 도메인 설치에 재사용하지 못하게 한다.
func TestExistingEnvironmentMustMatchInstallDomain(t *testing.T) {
	options := installTestOptions(t)
	values := map[string]string{
		"GOAPI_DOMAIN":       "https://other.example.com",
		"NUXT_PUBLIC_DOMAIN": "https://other.example.com",
	}
	if _, err := applyEnvironmentToInstallOptions(options, values); err == nil {
		t.Fatal("기존 환경 파일의 다른 도메인을 허용했습니다")
	}
}
