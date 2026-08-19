package main

import (
	"os"
	"path/filepath"
	"testing"
)

// adoption dry-run은 기존 설정을 해석하지만 새 운영 파일은 만들지 않는다.
func TestRunAdoptDryRunPreservesServer(t *testing.T) {
	install := installTestOptions(t)
	source := t.TempDir()
	legacy := "GOAPI_BASE=goapi\nGOAPI_PORT=3006\nGOAPI_DOMAIN=https://community.example.com\nGOAPI_TITLE=NUBO\nJWT_SECRET_KEY=secret\n" +
		"DB_HOST=127.0.0.1\nDB_USER=nubo\nDB_PASS=pass\nDB_NAME=nubo\nDB_TABLE_PREFIX=nubo_\nADMIN_ID=admin@example.com\nADMIN_PW=password\n"
	if err := os.WriteFile(filepath.Join(source, ".env"), []byte(legacy), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(source, "upload"), 0o755); err != nil {
		t.Fatal(err)
	}
	options := adoptOptions{
		releaseDir: install.releaseDir, sourceDir: source, currentLink: install.currentLink,
		envFile: install.envFile, stateDir: install.stateDir, systemdDir: install.systemdDir,
		osReleaseFile: install.osReleaseFile, nodeBinary: install.nodeBinary, dryRun: true,
	}
	if err := runAdopt(options, systemRunner{}, false); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{options.envFile, options.currentLink, filepath.Join(options.systemdDir, "nubo.target")} {
		if _, err := os.Lstat(path); !os.IsNotExist(err) {
			t.Fatalf("dry-run이 경로를 만들었습니다: %s", path)
		}
	}
}

func TestRunAdoptRejectsAlreadyManagedInstall(t *testing.T) {
	install := installTestOptions(t)
	if err := os.MkdirAll(filepath.Dir(install.envFile), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(install.envFile, []byte("managed=true\n"), 0o640); err != nil {
		t.Fatal(err)
	}
	options := adoptOptions{sourceDir: t.TempDir(), envFile: install.envFile, currentLink: install.currentLink}
	if err := runAdopt(options, fakeRunner{}, false); err == nil {
		t.Fatal("이미 관리되는 설치를 adoption 대상으로 허용했습니다")
	}
}
