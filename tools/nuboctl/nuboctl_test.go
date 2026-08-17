package main

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"os/user"
	"path/filepath"
	"runtime"
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
		"GOAPI_DOMAIN=http://community.example.com",
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

	if err := runInstall(options, systemRunner{}, false); err != nil {
		t.Fatalf("두 번째 설치 준비가 멱등적이지 않습니다: %v", err)
	}
}

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
}

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

func TestNginxServerNameMatchesCoveredDomain(t *testing.T) {
	for _, serverName := range []string{"community.example.com", "*.example.com", "~^community\\.example\\.com$", "~^community.example.com$"} {
		if !nginxServerNameMatches(serverName, "community.example.com") {
			t.Fatalf("%q이 대상 도메인을 포함하지 않는다고 판단했습니다", serverName)
		}
	}
	if nginxServerNameMatches("*.other.example", "community.example.com") {
		t.Fatal("관계없는 wildcard 도메인을 충돌로 판단했습니다")
	}
}

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

func TestInstallPlatformRejectsUnsupportedDistribution(t *testing.T) {
	path := filepath.Join(t.TempDir(), "os-release")
	if err := os.WriteFile(path, []byte("ID=debian\nVERSION_ID=13\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := validateInstallPlatform(path); err == nil {
		t.Fatal("공식 지원 대상이 아닌 배포판을 install이 허용했습니다")
	}
}

func installTestOptions(t *testing.T) installOptions {
	t.Helper()
	root := t.TempDir()
	releaseDir := filepath.Join(root, "release")
	createInstallTestRelease(t, releaseDir)
	nodeBinary := filepath.Join(root, "node")
	if err := os.WriteFile(nodeBinary, []byte("#!/bin/sh\necho v26.7.0\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	systemdDir := filepath.Join(root, "etc", "systemd", "system")
	nginxDir := filepath.Join(root, "etc", "nginx", "sites-available")
	osReleaseFile := filepath.Join(root, "etc", "os-release")
	for _, directory := range []string{systemdDir, nginxDir} {
		if err := os.MkdirAll(directory, 0o755); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(osReleaseFile, []byte("ID=ubuntu\nVERSION_ID=24.04\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	current, err := userCurrent()
	if err != nil {
		t.Fatal(err)
	}
	return installOptions{
		options: options{
			releaseDir:  releaseDir,
			envFile:     filepath.Join(root, "etc", "nubo", "nubo.env"),
			stateDir:    filepath.Join(root, "var", "lib", "nubo"),
			serviceUser: current.username,
		},
		domain:        "community.example.com",
		serviceGroup:  current.group,
		uploadDir:     filepath.Join(root, "var", "lib", "nubo", "upload"),
		nodeBinary:    nodeBinary,
		webPort:       3000,
		goapiPort:     3006,
		goapiPath:     "goapi",
		maxBodySize:   "100m",
		systemdDir:    systemdDir,
		nginxDir:      nginxDir,
		osReleaseFile: osReleaseFile,
	}
}

type testIdentity struct {
	username string
	group    string
}

func userCurrent() (testIdentity, error) {
	account, err := user.Current()
	if err != nil {
		return testIdentity{}, err
	}
	group, err := user.LookupGroupId(account.Gid)
	if err != nil {
		return testIdentity{}, err
	}
	return testIdentity{username: account.Username, group: group.Name}, nil
}

func createInstallTestRelease(t *testing.T, releaseDir string) {
	t.Helper()
	files := map[string]string{
		"manifest.json":                fmt.Sprintf(`{"schemaVersion":1,"releaseVersion":"1.2.1","target":{"os":%q,"arch":%q},"components":{}}`, runtime.GOOS, runtime.GOARCH) + "\n",
		"bin/goapi":                    "binary\n",
		"web/.output/server/index.mjs": "export default {}\n",
		"share/env.sample": strings.Join([]string{
			"GOAPI_BASE=goapi", "GOAPI_HOST=127.0.0.1", "GOAPI_PORT=3006", "GOAPI_DOMAIN=http://localhost",
			"NUBO_UPLOAD_DIR=./upload", "JWT_SECRET_KEY=#jwtsecret#", "SYNC_SECRET_KEY=#syncsecret#",
			"DB_HOST=#dbhost#", "DB_USER=#dbuser#", "DB_PASS=#dbpass#", "DB_NAME=#dbname#",
			"NITRO_HOST=127.0.0.1", "NITRO_PORT=3000", "NUXT_API_BASE_INTERNAL=http://127.0.0.1:3006/goapi",
			"NUXT_PUBLIC_GOAPI_BASE=goapi", "NUXT_PUBLIC_DOMAIN=http://localhost",
		}, "\n") + "\n",
		"share/systemd/nubo.target":           "[Unit]\nDescription=NUBO\n",
		"share/systemd/nubo-goapi.service.in": "[Service]\nUser=@NUBO_USER@\nGroup=@NUBO_GROUP@\nWorkingDirectory=@NUBO_STATE_DIR@\nEnvironment=\"NUBO_ENV_FILE=@NUBO_ENV_FILE@\"\nExecStart=@NUBO_RELEASE_DIR@/bin/goapi\nReadWritePaths=@NUBO_UPLOAD_DIR@\n",
		"share/systemd/nubo-web.service.in":   "[Service]\nUser=@NUBO_USER@\nGroup=@NUBO_GROUP@\nExecStart=@NODE_BINARY@ --env-file=@NUBO_ENV_FILE@ @NUBO_RELEASE_DIR@/web/.output/server/index.mjs\n",
		"share/nginx/nubo.conf.in":            "server {\n    server_name @NUBO_DOMAIN@;\n    client_max_body_size @NUBO_MAX_BODY_SIZE@;\n    location /upload/ { alias @NUBO_UPLOAD_DIR@/; }\n    location /@NUBO_GOAPI_PATH@/ { proxy_pass http://127.0.0.1:@NUBO_GOAPI_PORT@; }\n    location / { proxy_pass http://127.0.0.1:@NUBO_WEB_PORT@; }\n}\n",
	}
	for relative, contents := range files {
		path := filepath.Join(releaseDir, relative)
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(contents), 0o755); err != nil {
			t.Fatal(err)
		}
	}

	var checksumLines []string
	if err := filepath.WalkDir(releaseDir, func(path string, entry os.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		hash, err := fileSHA256(path)
		if err != nil {
			return err
		}
		relative, err := filepath.Rel(releaseDir, path)
		if err != nil {
			return err
		}
		checksumLines = append(checksumLines, fmt.Sprintf("%s  ./%s", hash, relative))
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(releaseDir, "checksums.txt"), []byte(strings.Join(checksumLines, "\n")+"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
}
