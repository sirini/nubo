package main

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRunSiteApplySwitchesOnlyWebToReadyBuild(t *testing.T) {
	options, runner := siteApplyTestSetup(t)
	readinessCalls := 0
	if err := runSiteApply(options, runner, func(string) error {
		readinessCalls++
		return nil
	}, false); err != nil {
		t.Fatal(err)
	}
	if readinessCalls != 2 {
		t.Fatalf("readiness 확인 횟수 = %d", readinessCalls)
	}
	assertCurrentTarget(t, options.currentLink, options.candidateDir)
	joined := strings.Join(*runner.calls, "\n")
	if strings.Count(joined, "systemctl restart nubo-web.service") != 1 {
		t.Fatalf("Web restart 명령이 올바르지 않습니다: %s", joined)
	}
	if strings.Contains(joined, "nubo-goapi.service") || strings.Contains(joined, " install") {
		t.Fatalf("스킨 적용이 GOAPI 또는 DB를 변경했습니다: %s", joined)
	}
	assertEnvironmentVersion(t, options.envFile, "1.2.1")
}

func TestRunSiteApplyDryRunDoesNotSwitchOrRestart(t *testing.T) {
	options, runner := siteApplyTestSetup(t)
	previous, _ := resolveCurrentRelease(options.currentLink)
	options.dryRun = true
	if err := runSiteApply(options, runner, func(string) error { return nil }, false); err != nil {
		t.Fatal(err)
	}
	assertCurrentTarget(t, options.currentLink, previous)
	if strings.Contains(strings.Join(*runner.calls, "\n"), "systemctl restart") {
		t.Fatalf("dry-run이 Web을 재시작했습니다: %v", *runner.calls)
	}
}

func TestRunSiteApplyRestoresPreviousBuildOnReadinessFailure(t *testing.T) {
	options, runner := siteApplyTestSetup(t)
	previous, _ := resolveCurrentRelease(options.currentLink)
	readinessCalls := 0
	err := runSiteApply(options, runner, func(string) error {
		readinessCalls++
		if readinessCalls == 2 {
			return errors.New("site build unavailable")
		}
		return nil
	}, false)
	if err == nil || !strings.Contains(err.Error(), "이전 스킨 빌드로 복구") {
		t.Fatalf("복구 결과 = %v", err)
	}
	assertCurrentTarget(t, options.currentLink, previous)
	if strings.Count(strings.Join(*runner.calls, "\n"), "systemctl restart nubo-web.service") != 2 {
		t.Fatalf("이전 Web 복구 명령이 없습니다: %v", *runner.calls)
	}
}

func TestSiteApplyRejectsDifferentBaseOrChangedGoapi(t *testing.T) {
	options, runner := siteApplyTestSetup(t)
	manifestPath := filepath.Join(options.candidateDir, "manifest.json")
	contents, _ := os.ReadFile(manifestPath)
	var manifest map[string]any
	if err := json.Unmarshal(contents, &manifest); err != nil {
		t.Fatal(err)
	}
	manifest["releaseVersion"] = "1.3.0"
	updated, _ := json.Marshal(manifest)
	if err := os.WriteFile(manifestPath, append(updated, '\n'), 0o755); err != nil {
		t.Fatal(err)
	}
	rewriteTestChecksums(t, options.candidateDir)
	if _, err := preflightSiteApply(options, runner, func(string) error { return nil }); err == nil || !strings.Contains(err.Error(), "기반 버전") {
		t.Fatalf("다른 기반 버전 결과 = %v", err)
	}

	markTestSiteBuild(t, options.candidateDir, "1.2.1")
	if err := os.WriteFile(filepath.Join(options.candidateDir, "bin", "goapi"), []byte("changed\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	rewriteTestChecksums(t, options.candidateDir)
	if _, err := preflightSiteApply(options, runner, func(string) error { return nil }); err == nil || !strings.Contains(err.Error(), "공식 파일") {
		t.Fatalf("변경된 GOAPI 결과 = %v", err)
	}
}

func siteApplyTestSetup(t *testing.T) (siteApplyOptions, fakeRunner) {
	t.Helper()
	update, runner := updateTestSetup(t)
	if err := os.RemoveAll(update.candidateDir); err != nil {
		t.Fatal(err)
	}
	createInstallTestReleaseVersion(t, update.candidateDir, "1.2.1")
	markTestSiteBuild(t, update.candidateDir, "1.2.1")
	return siteApplyOptions{
		candidateDir: update.candidateDir, currentLink: update.currentLink, envFile: update.envFile,
		stateDir: update.stateDir, serviceUser: update.serviceUser, systemdDir: update.systemdDir,
		osReleaseFile: update.osReleaseFile,
	}, runner
}

func markTestSiteBuild(t *testing.T, releaseDir, version string) {
	t.Helper()
	path := filepath.Join(releaseDir, "manifest.json")
	contents, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var manifest map[string]any
	if err := json.Unmarshal(contents, &manifest); err != nil {
		t.Fatal(err)
	}
	manifest["releaseVersion"] = version
	manifest["siteBuild"] = map[string]string{
		"baseVersion": version, "sourceCommit": "test-commit", "skinsHash": strings.Repeat("a", 64),
	}
	updated, err := json.Marshal(manifest)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, append(updated, '\n'), 0o755); err != nil {
		t.Fatal(err)
	}
	rewriteTestChecksums(t, releaseDir)
}
