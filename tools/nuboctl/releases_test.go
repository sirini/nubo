package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestPlanInstalledReleasesProtectsOperationalFallbacks(t *testing.T) {
	options, paths := releasesTestSetup(t)
	entries, err := planInstalledReleases(options, true)
	if err != nil {
		t.Fatal(err)
	}
	reasons := make(map[string]string)
	for _, entry := range entries {
		reasons[entry.name] = entry.reason
	}
	for name, expected := range map[string]string{
		"current-site":  "현재 활성 릴리스",
		"previous":      "직전 활성 릴리스",
		"official-base": "현재 커스텀 빌드의 공식 기반",
		"newest-spare":  "최신 예비 릴리스",
		"invalid":       "manifest를 인식할 수 없어 보존",
	} {
		if reasons[name] != expected {
			t.Fatalf("%s 보호 이유 = %q, 기대값 %q", name, reasons[name], expected)
		}
	}
	if reasons[filepath.Base(paths["old"])] != "" {
		t.Fatalf("오래된 릴리스가 삭제 후보가 아닙니다: %q", reasons[filepath.Base(paths["old"])])
	}
}

func TestPruneInstalledReleasesDryRunThenDeletesOnlyCandidate(t *testing.T) {
	options, paths := releasesTestSetup(t)
	options.dryRun = true
	if err := pruneInstalledReleases(options, false); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(paths["old"]); err != nil {
		t.Fatalf("dry-run이 릴리스를 삭제했습니다: %v", err)
	}

	options.dryRun = false
	if err := pruneInstalledReleases(options, false); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(paths["old"]); !os.IsNotExist(err) {
		t.Fatalf("오래된 릴리스 삭제 결과 = %v", err)
	}
	for _, key := range []string{"current", "previous", "base", "spare", "invalid"} {
		if _, err := os.Stat(paths[key]); err != nil {
			t.Fatalf("보호 릴리스 %s가 사라졌습니다: %v", key, err)
		}
	}
}

func TestPlanInstalledReleasesPreservesChecksumFailure(t *testing.T) {
	options, paths := releasesTestSetup(t)
	if err := os.WriteFile(filepath.Join(paths["old"], "bin", "goapi"), []byte("tampered\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	entries, err := planInstalledReleases(options, true)
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if entry.path == paths["old"] && !strings.Contains(entry.reason, "무결성 검증 실패") {
			t.Fatalf("손상 릴리스 보호 이유 = %q", entry.reason)
		}
	}
}

func TestRemoveInstalledReleasePreservesUntrackedOperatorFile(t *testing.T) {
	options, paths := releasesTestSetup(t)
	operatorFile := filepath.Join(paths["old"], "operator-note.txt")
	if err := os.WriteFile(operatorFile, []byte("keep me\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	entries, err := planInstalledReleases(options, true)
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if entry.path != paths["old"] {
			continue
		}
		if err := removeInstalledRelease(entry, options); err == nil || !strings.Contains(err.Error(), "checksum에 없는 파일") {
			t.Fatalf("추가 운영자 파일 삭제 결과 = %v", err)
		}
		if _, err := os.Stat(operatorFile); err != nil {
			t.Fatalf("추가 운영자 파일이 사라졌습니다: %v", err)
		}
		return
	}
	t.Fatal("삭제 후보 릴리스를 찾지 못했습니다")
}

func TestRememberPreviousReleaseDoesNotOverwriteRegularFile(t *testing.T) {
	root := t.TempDir()
	release := filepath.Join(root, "releases", "1.2.3")
	if err := os.MkdirAll(release, 0o755); err != nil {
		t.Fatal(err)
	}
	current := filepath.Join(root, "current")
	if err := os.WriteFile(filepath.Join(root, "previous"), []byte("operator owned\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := rememberPreviousRelease(current, release); err == nil {
		t.Fatal("기존 일반 previous 파일을 덮어썼습니다")
	}
}

func releasesTestSetup(t *testing.T) (releasesOptions, map[string]string) {
	t.Helper()
	root := filepath.Join(t.TempDir(), "opt", "nubo")
	releases := filepath.Join(root, "releases")
	paths := map[string]string{
		"current":  filepath.Join(releases, "current-site"),
		"previous": filepath.Join(releases, "previous"),
		"base":     filepath.Join(releases, "official-base"),
		"spare":    filepath.Join(releases, "newest-spare"),
		"old":      filepath.Join(releases, "old-release"),
		"invalid":  filepath.Join(releases, "invalid"),
	}
	createInstallTestReleaseVersion(t, paths["current"], "1.3.0")
	markTestSiteBuild(t, paths["current"], "1.3.0")
	createInstallTestReleaseVersion(t, paths["previous"], "1.2.3")
	createInstallTestReleaseVersion(t, paths["base"], "1.3.0")
	createInstallTestReleaseVersion(t, paths["spare"], "1.2.2")
	createInstallTestReleaseVersion(t, paths["old"], "1.2.1")
	if err := os.MkdirAll(paths["invalid"], 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(paths["invalid"], "manifest.json"), []byte("invalid\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	for path, age := range map[string]time.Duration{
		paths["spare"]:   time.Hour,
		paths["old"]:     2 * time.Hour,
		paths["invalid"]: 3 * time.Hour,
	} {
		stamp := now.Add(-age)
		if err := os.Chtimes(path, stamp, stamp); err != nil {
			t.Fatal(err)
		}
	}
	currentLink := filepath.Join(root, "current")
	previousLink := filepath.Join(root, "previous")
	if err := os.Symlink(paths["current"], currentLink); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(paths["previous"], previousLink); err != nil {
		t.Fatal(err)
	}
	return releasesOptions{
		action: "prune", releasesDir: releases, currentLink: currentLink,
		previousLink: previousLink, keep: 1,
	}, paths
}
