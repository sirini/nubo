package main

import (
	"os"
	"path/filepath"
	"testing"
)

// 런타임 버전만 바꾸고 mode와 복구용 원본을 보존한다.
func TestUpdateRuntimeVersionsCanRestoreEnvironment(t *testing.T) {
	path := filepath.Join(t.TempDir(), "nubo.env")
	original := []byte("DB_PASS=secret\nGOAPI_VERSION=1.2.1\nNUXT_PUBLIC_VERSION=1.2.1\n")
	if err := os.WriteFile(path, original, 0o640); err != nil {
		t.Fatal(err)
	}
	transition, err := updateRuntimeVersions(path, map[string]string{
		"GOAPI_VERSION": "1.3.0", "NUXT_PUBLIC_VERSION": "1.3.0",
	})
	if err != nil {
		t.Fatal(err)
	}
	if info, err := os.Stat(path); err != nil || info.Mode().Perm() != 0o640 {
		t.Fatalf("환경 파일 mode = %v, %v", info, err)
	}
	if err := restoreRuntimeEnvironment(path, transition); err != nil {
		t.Fatal(err)
	}
	if !environmentFileIs(path, original) {
		t.Fatal("환경 파일 원본이 복구되지 않았습니다")
	}
}

// 기대한 원본과 달라진 환경 파일은 원자적 교체가 덮어쓰지 않는다.
func TestReplaceExistingFileRejectsConcurrentChange(t *testing.T) {
	path := filepath.Join(t.TempDir(), "nubo.env")
	if err := os.WriteFile(path, []byte("VALUE=operator\n"), 0o640); err != nil {
		t.Fatal(err)
	}
	if err := replaceExistingFile(path, []byte("VALUE=new\n"), []byte("VALUE=old\n")); err == nil {
		t.Fatal("작업 중 변경된 환경 파일을 덮어썼습니다")
	}
	if !environmentFileIs(path, []byte("VALUE=operator\n")) {
		t.Fatal("운영자 환경 변경이 보존되지 않았습니다")
	}
}
