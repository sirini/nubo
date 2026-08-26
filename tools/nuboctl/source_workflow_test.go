package main

import (
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func TestPrepareSourceWorkflowRoutesPublicCommands(t *testing.T) {
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, "scripts"), 0o755); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{"package.json", "scripts/prepare-release.mjs", "scripts/prepare-site-release.mjs"} {
		if err := os.WriteFile(filepath.Join(root, path), []byte("test"), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	update, err := prepareSourceWorkflow("update", []string{"--dry-run"}, root)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(update.args, []string{"update", "--dry-run"}) || filepath.Base(update.script) != "prepare-release.mjs" {
		t.Fatalf("update 연결이 올바르지 않습니다: %+v", update)
	}
	customize, err := prepareSourceWorkflow("customize", nil, root)
	if err != nil {
		t.Fatal(err)
	}
	if len(customize.args) != 0 || filepath.Base(customize.script) != "prepare-site-release.mjs" {
		t.Fatalf("customize 연결이 올바르지 않습니다: %+v", customize)
	}
}

func TestPrepareSourceWorkflowExplainsWrongDirectory(t *testing.T) {
	_, err := prepareSourceWorkflow("customize", nil, t.TempDir())
	if err == nil || !strings.Contains(err.Error(), "NUBO 프로젝트 폴더") {
		t.Fatalf("프로젝트 폴더 오류 안내가 없습니다: %v", err)
	}
}

func TestSourceWorkflowEnvironmentAddsDefaultNodeHeap(t *testing.T) {
	environment, applied := sourceWorkflowEnvironment([]string{"PATH=/usr/bin", "NODE_OPTIONS=--trace-warnings"})
	if !applied || !reflect.DeepEqual(environment, []string{
		"PATH=/usr/bin",
		"NODE_OPTIONS=--trace-warnings --max-old-space-size=1536",
	}) {
		t.Fatalf("Node heap 기본값이 기존 옵션에 안전하게 추가되지 않았습니다: %v, %v", environment, applied)
	}

	environment, applied = sourceWorkflowEnvironment([]string{"PATH=/usr/bin"})
	if !applied || environment[len(environment)-1] != "NODE_OPTIONS=--max-old-space-size=1536" {
		t.Fatalf("NODE_OPTIONS가 없을 때 기본값이 추가되지 않았습니다: %v, %v", environment, applied)
	}
}

func TestSourceWorkflowEnvironmentPreservesUserNodeHeap(t *testing.T) {
	for _, nodeOptions := range []string{
		"--max-old-space-size=2048",
		"--trace-warnings --max_old_space_size=1024",
		"--max-old-space-size 1792",
	} {
		existing := []string{"NODE_OPTIONS=" + nodeOptions}
		environment, applied := sourceWorkflowEnvironment(existing)
		if applied || !reflect.DeepEqual(environment, existing) {
			t.Fatalf("사용자 Node heap 설정을 변경했습니다: %q → %v, %v", nodeOptions, environment, applied)
		}
	}
}

func TestReleaseOptionSelectsInternalUpdate(t *testing.T) {
	if !hasReleaseOption([]string{"--release", "/opt/nubo/releases/candidate"}) || !hasReleaseOption([]string{"--release=/tmp/candidate"}) {
		t.Fatal("내부 update의 --release 옵션을 찾지 못했습니다")
	}
	if hasReleaseOption([]string{"--dry-run"}) {
		t.Fatal("공개 update 옵션을 내부 update로 잘못 분류했습니다")
	}
}

func TestApplyRequiresExplicitReleaseDirectory(t *testing.T) {
	options, err := parseApplyOptions([]string{"/opt/nubo/releases/1.3.0", "--dry-run"})
	if err != nil || options.candidateDir != "/opt/nubo/releases/1.3.0" || !options.dryRun {
		t.Fatalf("apply options = %+v, %v", options, err)
	}
	if _, err := parseApplyOptions([]string{"--dry-run"}); err == nil {
		t.Fatal("apply가 명시적인 릴리스 경로 없이 실행됐습니다")
	}
}
