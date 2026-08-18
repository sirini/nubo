package main

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// 설치 결과를 바탕으로 site를 연결하고 실행 중 Nginx를 reload한다.
func TestActivateNginxLinksAndReloadsActiveService(t *testing.T) {
	options := nginxActivationTestOptions(t)
	calls := make([]string, 0, 4)
	runner := fakeRunner{
		paths:   map[string]bool{"nginx": true, "systemctl": true},
		outputs: map[string]string{},
		errors:  map[string]error{},
		calls:   &calls,
	}
	if err := activateNginx(options, runner, false); err != nil {
		t.Fatal(err)
	}
	if strings.Join(calls, "\n") != "nginx -t\nsystemctl is-active --quiet nginx.service\nsystemctl enable nginx.service\nsystemctl reload nginx.service" {
		t.Fatalf("Nginx 명령 순서 = %v", calls)
	}
	assertEnabledSite(t, options)
	if err := activateNginx(options, runner, false); err != nil {
		t.Fatalf("두 번째 활성화가 멱등적이지 않습니다: %v", err)
	}
}

// 멈춘 Nginx는 설정 검증과 부팅 활성화 뒤 start한다.
func TestActivateNginxStartsInactiveService(t *testing.T) {
	options := nginxActivationTestOptions(t)
	calls := make([]string, 0, 4)
	runner := fakeRunner{
		paths: map[string]bool{"nginx": true, "systemctl": true}, outputs: map[string]string{},
		errors: map[string]error{"systemctl is-active --quiet nginx.service": errors.New("inactive")}, calls: &calls,
	}
	if err := activateNginx(options, runner, false); err != nil {
		t.Fatal(err)
	}
	if calls[len(calls)-1] != "systemctl start nginx.service" {
		t.Fatalf("마지막 Nginx 명령 = %v", calls)
	}
}

// 전체 설정 검증이 실패하면 이번에 만든 링크를 되돌린다.
func TestActivateNginxRollsBackLinkOnValidationFailure(t *testing.T) {
	options := nginxActivationTestOptions(t)
	runner := fakeRunner{
		paths: map[string]bool{"nginx": true, "systemctl": true}, outputs: map[string]string{},
		errors: map[string]error{"nginx -t": errors.New("invalid")},
	}
	if err := activateNginx(options, runner, false); err == nil {
		t.Fatal("잘못된 Nginx 설정을 활성화했습니다")
	}
	enabled := filepath.Join(options.enabledDir, "nubo-community.example.com.conf")
	if _, err := os.Lstat(enabled); !os.IsNotExist(err) {
		t.Fatalf("실패 뒤 enabled 링크가 남았습니다: %v", err)
	}
}

// 운영자가 만든 enabled 파일이나 다른 링크는 덮어쓰지 않는다.
func TestActivateNginxRejectsConflictingEnabledEntry(t *testing.T) {
	options := nginxActivationTestOptions(t)
	enabled := filepath.Join(options.enabledDir, "nubo-community.example.com.conf")
	if err := os.WriteFile(enabled, []byte("operator owned\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := activateNginx(options, fakeRunner{}, false); err == nil {
		t.Fatal("운영자 소유 enabled 파일을 허용했습니다")
	}
}

func nginxActivationTestOptions(t *testing.T) nginxActivationOptions {
	t.Helper()
	root := t.TempDir()
	availableDir := filepath.Join(root, "sites-available")
	enabledDir := filepath.Join(root, "sites-enabled")
	if err := os.MkdirAll(availableDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(enabledDir, 0o755); err != nil {
		t.Fatal(err)
	}
	envFile := filepath.Join(root, "nubo.env")
	if err := os.WriteFile(envFile, []byte("NUXT_PUBLIC_DOMAIN=https://community.example.com\n"), 0o640); err != nil {
		t.Fatal(err)
	}
	site := filepath.Join(availableDir, "nubo-community.example.com.conf")
	if err := os.WriteFile(site, []byte("server { server_name community.example.com; }\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	return nginxActivationOptions{envFile: envFile, availableDir: availableDir, enabledDir: enabledDir}
}

func assertEnabledSite(t *testing.T, options nginxActivationOptions) {
	t.Helper()
	enabled := filepath.Join(options.enabledDir, "nubo-community.example.com.conf")
	if info, err := os.Lstat(enabled); err != nil || info.Mode()&os.ModeSymlink == 0 {
		t.Fatalf("enabled site 링크 = %v, %v", info, err)
	}
}
