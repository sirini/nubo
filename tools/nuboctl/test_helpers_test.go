package main

import (
	"errors"
	"fmt"
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
	calls   *[]string
}

// 테스트에서 지정한 명령만 시스템에 존재하는 것처럼 돌려준다.
func (runner fakeRunner) lookPath(name string) (string, error) {
	if runner.paths[name] {
		return "/usr/bin/" + name, nil
	}
	return "", errors.New("not found")
}

// 명령 전체 문자열을 키로 사용해 준비된 출력과 오류를 돌려준다.
func (runner fakeRunner) run(name string, args ...string) (string, error) {
	key := strings.Join(append([]string{name}, args...), " ")
	if runner.calls != nil {
		*runner.calls = append(*runner.calls, key)
	}
	return runner.outputs[key], runner.errors[key]
}

type testIdentity struct {
	username string
	group    string
}

// 설치 테스트가 실제 시스템 계정을 새로 만들지 않도록 현재 계정을 반환한다.
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

// 실제 시스템 경로 대신 임시 경로를 사용하는 완전한 설치 옵션을 만든다.
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
		currentLink:   filepath.Join(root, "opt", "nubo", "current"),
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

// manifest, 필수 파일과 checksum을 갖춘 작은 릴리스를 만든다.
func createInstallTestRelease(t *testing.T, releaseDir string) {
	t.Helper()
	files := map[string]string{
		"manifest.json":             fmt.Sprintf(`{"schemaVersion":2,"releaseVersion":"1.2.1","target":{"os":%q,"arch":%q},"components":{},"nativeLibraries":{"libvips":{"version":"8.18.3","selection":"glibc-hwcaps","variants":{"x86-64":{"path":"lib/libvips-cpp.so.8.18.3","source":"test"},"x86-64-v2":{"path":"lib/glibc-hwcaps/x86-64-v2/libvips-cpp.so.8.18.3","source":"test"}}}}}`, runtime.GOOS, runtime.GOARCH) + "\n",
		"bin/goapi":                 "#!/bin/sh\nexit 0\n",
		"lib/libvips-cpp.so.8.18.3": "library\n",
		"lib/glibc-hwcaps/x86-64-v2/libvips-cpp.so.8.18.3": "optimized library\n",
		"web/.output/server/index.mjs":                     "export default {}\n",
		"share/env.sample": strings.Join([]string{
			"GOAPI_BASE=goapi", "GOAPI_HOST=127.0.0.1", "GOAPI_PORT=3006", "GOAPI_DOMAIN=http://localhost", "GOAPI_TITLE=NUBO",
			"NUBO_UPLOAD_DIR=./upload", "JWT_SECRET_KEY=#jwtsecret#", "SYNC_SECRET_KEY=#syncsecret#",
			"DB_HOST=#dbhost#", "DB_USER=#dbuser#", "DB_PASS=#dbpass#", "DB_NAME=#dbname#",
			"DB_TABLE_PREFIX=#dbprefix#", "DB_PORT=#dbport#", "DB_UNIX_SOCKET=#dbsock#", "DB_MAX_IDLE=#dbmaxidle#", "DB_MAX_OPEN=#dbmaxopen#",
			"ADMIN_ID=#adminid#", "ADMIN_PW=#adminpw#",
			"NITRO_HOST=127.0.0.1", "NITRO_PORT=3000", "NUXT_API_BASE_INTERNAL=http://127.0.0.1:3006/goapi",
			"NUXT_PUBLIC_GOAPI_BASE=goapi", "NUXT_PUBLIC_DOMAIN=http://localhost", "NUXT_PUBLIC_TITLE=NUBO", "NUXT_PUBLIC_ADMIN_ID=#adminid#",
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
