package main

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// migration과 링크 전환 뒤 새 릴리스 readiness까지 확인한다.
func TestRunUpdateSwitchesToReadyCandidate(t *testing.T) {
	options, runner := updateTestSetup(t)
	readinessCalls := 0
	err := runUpdate(options, runner, func(string) error {
		readinessCalls++
		return nil
	}, false)
	if err != nil {
		t.Fatal(err)
	}
	if readinessCalls != 2 {
		t.Fatalf("readiness 확인 횟수 = %d", readinessCalls)
	}
	assertCurrentTarget(t, options.currentLink, options.candidateDir)
	joined := strings.Join(*runner.calls, "\n")
	if !strings.Contains(joined, filepath.Join(options.candidateDir, "bin", "goapi")+" install") {
		t.Fatalf("후보 migration 명령이 없습니다: %s", joined)
	}
	if !strings.Contains(joined, "systemctl restart nubo-goapi.service nubo-web.service") {
		t.Fatalf("서비스 restart 명령이 없습니다: %s", joined)
	}
	assertEnvironmentVersion(t, options.envFile, "1.3.0")
}

// 새 릴리스 readiness 실패 시 이전 링크와 프로세스를 복구한다.
func TestRunUpdateRestoresPreviousReleaseOnReadinessFailure(t *testing.T) {
	options, runner := updateTestSetup(t)
	previous, err := resolveCurrentRelease(options.currentLink)
	if err != nil {
		t.Fatal(err)
	}
	readinessCalls := 0
	err = runUpdate(options, runner, func(string) error {
		readinessCalls++
		if readinessCalls == 2 {
			return errors.New("candidate unavailable")
		}
		return nil
	}, false)
	if err == nil || !strings.Contains(err.Error(), "DB migration은 유지") {
		t.Fatalf("복구 결과 = %v", err)
	}
	assertCurrentTarget(t, options.currentLink, previous)
	assertEnvironmentVersion(t, options.envFile, "1.2.1")
	if strings.Count(strings.Join(*runner.calls, "\n"), "systemctl restart nubo-goapi.service nubo-web.service") != 2 {
		t.Fatalf("이전 서비스 restart가 실행되지 않았습니다: %v", *runner.calls)
	}
}

// migration 실패는 current나 서비스를 바꾸기 전에 중단한다.
func TestRunUpdateStopsBeforeSwitchOnMigrationFailure(t *testing.T) {
	options, runner := updateTestSetup(t)
	previous, _ := resolveCurrentRelease(options.currentLink)
	migration := updateMigrationCall(options)
	runner.errors[migration] = errors.New("migration failed")
	if err := runUpdate(options, runner, func(string) error { return nil }, false); err == nil {
		t.Fatal("migration 실패를 허용했습니다")
	}
	assertCurrentTarget(t, options.currentLink, previous)
	if strings.Contains(strings.Join(*runner.calls, "\n"), "systemctl restart") {
		t.Fatal("migration 실패 뒤 서비스를 restart했습니다")
	}
}

// dry-run은 preflight만 수행하고 migration과 링크 전환을 생략한다.
func TestRunUpdateDryRunDoesNotChangeRelease(t *testing.T) {
	options, runner := updateTestSetup(t)
	options.dryRun = true
	previous, _ := resolveCurrentRelease(options.currentLink)
	if err := runUpdate(options, runner, func(string) error { return nil }, false); err != nil {
		t.Fatal(err)
	}
	assertCurrentTarget(t, options.currentLink, previous)
	joined := strings.Join(*runner.calls, "\n")
	if strings.Contains(joined, " install") || strings.Contains(joined, "systemctl restart") {
		t.Fatalf("dry-run이 update를 실행했습니다: %s", joined)
	}
}

// 백업 확인을 거절하면 preflight 뒤 어떤 변경도 수행하지 않는다.
func TestRunUpdateCancellationDoesNotChangeRelease(t *testing.T) {
	options, runner := updateTestSetup(t)
	options.backupConfirmed = false
	options.confirmBackup = func() (bool, error) { return false, nil }
	previous, _ := resolveCurrentRelease(options.currentLink)
	if err := runUpdate(options, runner, func(string) error { return nil }, false); err != nil {
		t.Fatal(err)
	}
	assertCurrentTarget(t, options.currentLink, previous)
	if strings.Contains(strings.Join(*runner.calls, "\n"), " install") {
		t.Fatal("백업 미확인 상태에서 migration을 실행했습니다")
	}
}

// 같은 버전이나 낮은 버전은 update 경로로 전환하지 않는다.
func TestRequireNewerRelease(t *testing.T) {
	for _, candidate := range []string{"1.2.1", "1.2.0", "1.1.9"} {
		if err := requireNewerRelease("1.2.1", candidate); err == nil {
			t.Fatalf("낮은 후보 버전 %s을 허용했습니다", candidate)
		}
	}
	if err := requireNewerRelease("1.2.1", "1.3.0"); err != nil {
		t.Fatal(err)
	}
}

// 한 설치에서는 update 잠금을 동시에 두 번 얻을 수 없다.
func TestAcquireUpdateLockRejectsConcurrentUpdate(t *testing.T) {
	options, _ := updateTestSetup(t)
	first, err := acquireUpdateLock(options.currentLink)
	if err != nil {
		t.Fatal(err)
	}
	defer first.close()
	if second, err := acquireUpdateLock(options.currentLink); err == nil {
		second.close()
		t.Fatal("동시 update 잠금을 허용했습니다")
	}
}

// 자동 반영할 수 없는 운영 템플릿 변경을 후보에서 거부한다.
func TestValidateCandidateTemplatesRejectsChange(t *testing.T) {
	options, _ := updateTestSetup(t)
	previous, _ := resolveCurrentRelease(options.currentLink)
	template := filepath.Join(options.candidateDir, "share", "nginx", "nubo.conf.in")
	if err := os.WriteFile(template, []byte("changed\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := validateCandidateTemplates(previous, options.candidateDir); err == nil {
		t.Fatal("변경된 운영 템플릿을 허용했습니다")
	}
}

// 대표 service가 없던 기존 릴리스도 내부 운영 템플릿이 같으면 update할 수 있다.
func TestValidateCandidateTemplatesAllowsNewFacadeService(t *testing.T) {
	options, _ := updateTestSetup(t)
	previous, _ := resolveCurrentRelease(options.currentLink)
	if err := os.Remove(filepath.Join(previous, "share", "systemd", "nubo.service")); err != nil {
		t.Fatal(err)
	}
	if err := validateCandidateTemplates(previous, options.candidateDir); err != nil {
		t.Fatal(err)
	}
}

func updateTestSetup(t *testing.T) (updateOptions, fakeRunner) {
	t.Helper()
	install := installTestOptions(t)
	install.environmentValues = map[string]string{
		"DB_HOST": "127.0.0.1", "DB_USER": "nubo", "DB_PASS": "secret", "DB_NAME": "nubo",
	}
	if err := runInstall(install, systemRunner{}, false); err != nil {
		t.Fatal(err)
	}
	candidate := filepath.Join(filepath.Dir(install.releaseDir), "candidate")
	createInstallTestReleaseVersion(t, candidate, "1.3.0")
	calls := make([]string, 0, 8)
	runner := fakeRunner{
		paths:   map[string]bool{"systemctl": true, "runuser": true},
		outputs: map[string]string{install.nodeBinary + " --version": "v26.7.0\n"},
		errors:  map[string]error{}, calls: &calls,
	}
	options := updateOptions{
		candidateDir: candidate, currentLink: install.currentLink, envFile: install.envFile,
		stateDir: install.stateDir, serviceUser: install.serviceUser, systemdDir: install.systemdDir,
		osReleaseFile: install.osReleaseFile, backupConfirmed: true,
	}
	return options, runner
}

func updateMigrationCall(options updateOptions) string {
	call := "env NUBO_ENV_FILE=" + options.envFile + " " + filepath.Join(options.candidateDir, "bin", "goapi") + " install"
	if currentEUID() == 0 {
		call = "runuser -u " + options.serviceUser + " -- " + call
	}
	return call
}

func assertCurrentTarget(t *testing.T, current, expected string) {
	t.Helper()
	target, err := filepath.EvalSymlinks(current)
	if err != nil {
		t.Fatal(err)
	}
	expected, err = filepath.EvalSymlinks(expected)
	if err != nil || target != expected {
		t.Fatalf("current = %s, want %s (%v)", target, expected, err)
	}
}

func assertEnvironmentVersion(t *testing.T, path, expected string) {
	t.Helper()
	values, err := readEnvironment(path)
	if err != nil {
		t.Fatal(err)
	}
	for _, key := range []string{"GOAPI_VERSION", "NUXT_PUBLIC_VERSION"} {
		if values[key] != expected {
			t.Fatalf("%s = %s, want %s", key, values[key], expected)
		}
	}
}
