package main

import (
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func TestOccupiedAdoptionPortsFindsOnlyListeningPort(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	occupiedPort := listener.Addr().(*net.TCPAddr).Port
	probe, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	freePort := probe.Addr().(*net.TCPAddr).Port
	_ = probe.Close()
	ports := occupiedAdoptionPorts(occupiedPort, freePort)
	if len(ports) != 1 || ports[0] != occupiedPort {
		t.Fatalf("점유 포트 = %v", ports)
	}
}

func TestAdoptionIdentityWarningAllowsRootWithSandboxNotice(t *testing.T) {
	if warning := adoptionIdentityWarning("root"); !strings.Contains(warning, "root로 실행") || !strings.Contains(warning, "쓰기 경로 제한") {
		t.Fatalf("root 서비스 경고 = %q", warning)
	}
	if warning := adoptionIdentityWarning("nubo"); warning != "" {
		t.Fatalf("일반 계정 경고 = %q", warning)
	}
}

// 실제 adoption은 점유 포트를 발견하면 어떤 운영 파일도 만들기 전에 중단한다.
func TestRunAdoptRejectsOccupiedPortBeforeWriting(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	occupiedPort := listener.Addr().(*net.TCPAddr).Port

	install := installTestOptions(t)
	source := t.TempDir()
	legacy := "GOAPI_BASE=goapi\nGOAPI_PORT=3006\nNITRO_PORT=" + strconv.Itoa(occupiedPort) + "\n" +
		"GOAPI_DOMAIN=https://community.example.com\nGOAPI_TITLE=NUBO\nJWT_SECRET_KEY=secret\n" +
		"DB_HOST=127.0.0.1\nDB_USER=nubo\nDB_PASS=pass\nDB_NAME=nubo\nDB_TABLE_PREFIX=nubo_\nADMIN_ID=admin@example.com\nADMIN_PW=password\n"
	if err := os.WriteFile(filepath.Join(source, ".env"), []byte(legacy), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(source, "upload"), 0o755); err != nil {
		t.Fatal(err)
	}
	options := adoptOptions{
		releaseDir: install.releaseDir, sourceDir: source, currentLink: install.currentLink,
		commandLink: install.commandLink,
		envFile:     install.envFile, stateDir: install.stateDir, systemdDir: install.systemdDir,
		osReleaseFile: install.osReleaseFile, nodeBinary: install.nodeBinary,
		nonInteractive: true, backupConfirmed: true,
	}
	err = runAdopt(options, systemRunner{}, false)
	if err == nil || !strings.Contains(err.Error(), strconv.Itoa(occupiedPort)) {
		t.Fatalf("점유 포트 오류 = %v", err)
	}
	if _, err := os.Lstat(options.envFile); !os.IsNotExist(err) {
		t.Fatal("점유 포트가 있는데 환경 파일을 만들었습니다")
	}
}

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
		commandLink: install.commandLink,
		envFile:     install.envFile, stateDir: install.stateDir, systemdDir: install.systemdDir,
		osReleaseFile: install.osReleaseFile, nodeBinary: install.nodeBinary, dryRun: true,
	}
	if err := runAdopt(options, systemRunner{}, false); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{options.envFile, options.currentLink, filepath.Join(options.systemdDir, "nubo.service"), filepath.Join(options.systemdDir, "nubo.target")} {
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
