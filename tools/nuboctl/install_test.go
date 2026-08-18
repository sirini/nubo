package main

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// 설치 준비가 필요한 파일을 만들고 재실행 시 그대로 보존하는지 확인한다.
func TestInstallCreatesFilesAndIsIdempotent(t *testing.T) {
	options := installTestOptions(t)
	if err := runInstall(options, systemRunner{}, false); err != nil {
		t.Fatal(err)
	}

	environment, err := os.ReadFile(options.envFile)
	if err != nil {
		t.Fatal(err)
	}
	text := string(environment)
	for _, expected := range []string{
		"GOAPI_DOMAIN=https://community.example.com",
		"NUBO_UPLOAD_DIR=" + options.uploadDir,
		"NUXT_API_BASE_INTERNAL=http://127.0.0.1:3006/goapi",
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("환경 파일에 %q가 없습니다", expected)
		}
	}
	if strings.Contains(text, "JWT_SECRET_KEY=#jwtsecret#") || strings.Contains(text, "SYNC_SECRET_KEY=#syncsecret#") {
		t.Fatal("새 환경 파일에 비밀값 placeholder가 남았습니다")
	}
	if info, err := os.Stat(options.envFile); err != nil || info.Mode().Perm() != 0o640 {
		t.Fatalf("환경 파일 권한 = %v, %v", info, err)
	}

	for _, path := range []string{
		filepath.Join(options.systemdDir, "nubo.target"),
		filepath.Join(options.systemdDir, "nubo-goapi.service"),
		filepath.Join(options.systemdDir, "nubo-web.service"),
		filepath.Join(options.nginxDir, "nubo-community.example.com.conf"),
	} {
		contents, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		if strings.Contains(string(contents), "@NUBO_") || strings.Contains(string(contents), "@NODE_BINARY@") {
			t.Fatalf("치환되지 않은 토큰이 있습니다: %s", path)
		}
	}
	currentTarget, err := filepath.EvalSymlinks(options.currentLink)
	if err != nil || currentTarget != options.releaseDir {
		t.Fatalf("current 링크 = %s, %v", currentTarget, err)
	}
	webUnit, err := os.ReadFile(filepath.Join(options.systemdDir, "nubo-web.service"))
	if err != nil || !strings.Contains(string(webUnit), options.currentLink+"/web/.output/server/index.mjs") {
		t.Fatalf("웹 unit이 current 링크를 사용하지 않습니다: %v", err)
	}

	if err := runInstall(options, systemRunner{}, false); err != nil {
		t.Fatalf("두 번째 설치 준비가 멱등적이지 않습니다: %v", err)
	}
}

// dry-run이 계획만 보여주고 서버 파일을 바꾸지 않는지 확인한다.
func TestInstallDryRunDoesNotCreateFiles(t *testing.T) {
	options := installTestOptions(t)
	options.dryRun = true
	if err := runInstall(options, systemRunner{}, false); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(options.envFile); !os.IsNotExist(err) {
		t.Fatal("dry-run이 환경 파일을 생성했습니다")
	}
	if _, err := os.Stat(options.stateDir); !os.IsNotExist(err) {
		t.Fatal("dry-run이 상태 디렉터리를 생성했습니다")
	}
	if _, err := os.Lstat(options.currentLink); !os.IsNotExist(err) {
		t.Fatal("dry-run이 current 링크를 생성했습니다")
	}
}

// 다른 릴리스를 가리키는 current 링크를 install이 바꾸지 않는다.
func TestInstallRefusesToReplaceCurrentRelease(t *testing.T) {
	options := installTestOptions(t)
	other := filepath.Join(t.TempDir(), "other-release")
	if err := os.MkdirAll(other, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Dir(options.currentLink), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(other, options.currentLink); err != nil {
		t.Fatal(err)
	}
	if err := runInstall(options, systemRunner{}, false); err == nil {
		t.Fatal("install이 다른 current 릴리스를 바꾸려고 했습니다")
	}
	if target, err := filepath.EvalSymlinks(options.currentLink); err != nil || target != other {
		t.Fatalf("기존 current 링크가 변경됐습니다: %s, %v", target, err)
	}
}

// 비대화형 DB·관리자 입력을 최종 환경 파일에 반영한다.
func TestInstallUsesPrivateEnvironmentInput(t *testing.T) {
	options := installTestOptions(t)
	options.envInput = filepath.Join(t.TempDir(), "install.env")
	input := strings.Join([]string{
		"GOAPI_TITLE=AI 설치 커뮤니티", "NUXT_PUBLIC_TITLE=AI 설치 커뮤니티",
		"DB_HOST=127.0.0.1", "DB_PORT=3306", "DB_USER=nubo", "DB_PASS=db-secret", "DB_NAME=nubo", "DB_TABLE_PREFIX=nubo_",
		"ADMIN_ID=admin@example.com", "ADMIN_PW=admin-password", "NUXT_PUBLIC_ADMIN_ID=admin@example.com",
	}, "\n") + "\n"
	if err := os.WriteFile(options.envInput, []byte(input), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := runInstall(options, systemRunner{}, false); err != nil {
		t.Fatal(err)
	}
	contents, err := os.ReadFile(options.envFile)
	if err != nil {
		t.Fatal(err)
	}
	for _, expected := range []string{"GOAPI_TITLE=AI 설치 커뮤니티", "DB_PASS=db-secret", "ADMIN_ID=admin@example.com"} {
		if !strings.Contains(string(contents), expected) {
			t.Fatalf("비대화형 환경 파일에 %q가 없습니다", expected)
		}
	}
}

// 기존 도메인 설정 발견 시 모든 쓰기를 막는다.
func TestInstallRejectsExistingNginxDomainBeforeWriting(t *testing.T) {
	options := installTestOptions(t)
	conflicting := filepath.Join(filepath.Dir(options.nginxDir), "conf.d", "existing.conf")
	if err := os.MkdirAll(filepath.Dir(conflicting), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(conflicting, []byte("server { server_name community.example.com; }\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := runInstall(options, systemRunner{}, false); err == nil {
		t.Fatal("기존 Nginx 도메인 설정을 허용했습니다")
	}
	if _, err := os.Stat(options.envFile); !os.IsNotExist(err) {
		t.Fatal("Nginx 충돌 후 환경 파일이 생성됐습니다")
	}
}

// 운영자 소유 unit이 다르면 설치가 중단되는지 확인한다.
func TestInstallRefusesToOverwriteRenderedFiles(t *testing.T) {
	options := installTestOptions(t)
	target := filepath.Join(options.systemdDir, "nubo-web.service")
	if err := os.WriteFile(target, []byte("operator owned\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := runInstall(options, systemRunner{}, false); err == nil {
		t.Fatal("기존 systemd 파일을 덮어쓰려고 했습니다")
	}
	if _, err := os.Stat(options.envFile); !os.IsNotExist(err) {
		t.Fatal("충돌 검사 전에 환경 파일이 생성됐습니다")
	}
}

// 기존 업로드 경로의 쓰기 실패를 설치 전에 알린다.
func TestValidateExistingUploadDirectoryRejectsNoWrite(t *testing.T) {
	options := installTestOptions(t)
	if err := os.MkdirAll(options.uploadDir, 0o755); err != nil {
		t.Fatal(err)
	}
	runner := fakeRunner{
		paths:  map[string]bool{"runuser": true},
		errors: map[string]error{},
	}
	if currentEUID() == 0 {
		key := "runuser -u " + options.serviceUser + " -- test -w " + options.uploadDir
		runner.errors[key] = errors.New("not writable")
	} else {
		runner.errors["test -w "+options.uploadDir] = errors.New("not writable")
	}
	if err := validateExistingUploadDirectory(options, runner); err == nil {
		t.Fatal("쓸 수 없는 기존 업로드 디렉터리를 허용했습니다")
	}
}

// 지원하지 않는 배포판에서 설치를 막는다.
func TestInstallPlatformRejectsUnsupportedDistribution(t *testing.T) {
	path := filepath.Join(t.TempDir(), "os-release")
	if err := os.WriteFile(path, []byte("ID=debian\nVERSION_ID=13\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := validateInstallPlatform(path); err == nil {
		t.Fatal("공식 지원 대상이 아닌 배포판을 install이 허용했습니다")
	}
}
