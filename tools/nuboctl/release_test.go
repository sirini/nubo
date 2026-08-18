package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestVerifyReleaseChecksums는 목록에 기록된 파일의 정상값과 변경을 구분하는지 확인한다.
func TestVerifyReleaseChecksums(t *testing.T) {
	releaseDir := t.TempDir()
	filePath := filepath.Join(releaseDir, "share", "env.sample")
	if err := os.MkdirAll(filepath.Dir(filePath), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filePath, []byte("NUBO\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	hash, err := fileSHA256(filePath)
	if err != nil {
		t.Fatal(err)
	}
	checksums := fmt.Sprintf("%s  ./share/env.sample\n", hash)
	if err := os.WriteFile(filepath.Join(releaseDir, "checksums.txt"), []byte(checksums), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filePath, []byte("changed\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err == nil {
		t.Fatal("변경된 파일의 checksum 검증이 성공했습니다")
	}
}

// TestVerifyReleaseChecksumsRejectsTraversal은 checksum 항목이 릴리스 밖 파일을 읽지 못하게 한다.
func TestVerifyReleaseChecksumsRejectsTraversal(t *testing.T) {
	releaseDir := t.TempDir()
	line := strings.Repeat("0", 64) + "  ./../outside\n"
	if err := os.WriteFile(filepath.Join(releaseDir, "checksums.txt"), []byte(line), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err == nil {
		t.Fatal("릴리스 밖 checksum 경로를 허용했습니다")
	}
}

// TestVerifyReleaseChecksumsRejectsListedEscapingSymlink은 검증 대상 링크가 릴리스 밖을 가리키지 못하게 한다.
func TestVerifyReleaseChecksumsRejectsListedEscapingSymlink(t *testing.T) {
	releaseDir := t.TempDir()
	outside := filepath.Join(t.TempDir(), "outside")
	if err := os.WriteFile(outside, []byte("outside\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	linkPath := filepath.Join(releaseDir, "link")
	if err := os.Symlink(outside, linkPath); err != nil {
		t.Fatal(err)
	}
	hash, err := fileSHA256(outside)
	if err != nil {
		t.Fatal(err)
	}
	line := fmt.Sprintf("%s  ./link\n", hash)
	if err := os.WriteFile(filepath.Join(releaseDir, "checksums.txt"), []byte(line), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err == nil {
		t.Fatal("checksum에 기록된 릴리스 밖 심볼릭 링크를 허용했습니다")
	}
}

// TestVerifyReleaseChecksumsAllowsUnlistedFile은 사용자 추가 파일을 릴리스 손상으로 오인하지 않게 한다.
func TestVerifyReleaseChecksumsAllowsUnlistedFile(t *testing.T) {
	releaseDir := t.TempDir()
	filePath := filepath.Join(releaseDir, "manifest.json")
	if err := os.WriteFile(filePath, []byte("{}\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	hash, err := fileSHA256(filePath)
	if err != nil {
		t.Fatal(err)
	}
	line := fmt.Sprintf("%s  ./manifest.json\n", hash)
	if err := os.WriteFile(filepath.Join(releaseDir, "checksums.txt"), []byte(line), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(releaseDir, "operator-note.txt"), []byte("추가 메모\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := verifyReleaseChecksums(releaseDir); err != nil {
		t.Fatalf("checksum에 없는 추가 파일을 거부했습니다: %v", err)
	}
}
