package main

import (
	"errors"
	"path/filepath"
	"strings"
	"testing"
)

// 외부 환경 파일과 GOAPI install 인자를 정확히 전달하는지 확인한다.
func TestInstallDatabaseRunsGoapiWithExternalEnvironment(t *testing.T) {
	options := installTestOptions(t)
	calls := make([]string, 0, 1)
	runner := fakeRunner{
		paths:   map[string]bool{"runuser": true},
		outputs: map[string]string{},
		errors:  map[string]error{},
		calls:   &calls,
	}
	if err := installDatabase(options, runner); err != nil {
		t.Fatal(err)
	}
	if len(calls) != 1 {
		t.Fatalf("DB 설치 명령 실행 횟수 = %d, want 1", len(calls))
	}
	call := calls[0]
	for _, expected := range []string{
		"NUBO_ENV_FILE=" + options.envFile,
		filepath.Join(options.releaseDir, "bin", "goapi") + " install",
	} {
		if !strings.Contains(call, expected) {
			t.Fatalf("DB 설치 명령에 %q가 없습니다: %s", expected, call)
		}
	}
}

// GOAPI 출력 내용을 포함해 설치 실패 원인을 운영자에게 전달한다.
func TestInstallDatabaseReturnsGoapiFailure(t *testing.T) {
	options := installTestOptions(t)
	key := "env NUBO_ENV_FILE=" + options.envFile + " " + filepath.Join(options.releaseDir, "bin", "goapi") + " install"
	if currentEUID() == 0 {
		key = "runuser -u " + options.serviceUser + " -- " + key
	}
	runner := fakeRunner{
		paths:   map[string]bool{"runuser": true},
		outputs: map[string]string{key: "access denied"},
		errors:  map[string]error{key: errors.New("exit status 1")},
	}
	err := installDatabase(options, runner)
	if err == nil || !strings.Contains(err.Error(), "access denied") {
		t.Fatalf("DB 설치 실패 = %v", err)
	}
}
