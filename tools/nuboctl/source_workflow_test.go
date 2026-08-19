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

func TestReleaseOptionSelectsInternalUpdate(t *testing.T) {
	if !hasReleaseOption([]string{"--release", "/opt/nubo/releases/candidate"}) || !hasReleaseOption([]string{"--release=/tmp/candidate"}) {
		t.Fatal("내부 update의 --release 옵션을 찾지 못했습니다")
	}
	if hasReleaseOption([]string{"--dry-run"}) {
		t.Fatal("공개 update 옵션을 내부 update로 잘못 분류했습니다")
	}
}
