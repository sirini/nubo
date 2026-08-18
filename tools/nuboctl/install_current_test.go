package main

import (
	"os"
	"path/filepath"
	"testing"
)

// 같은 릴리스 링크는 보존하고 다른 대상이나 일반 경로는 거부한다.
func TestValidateCurrentReleaseProtectsExistingPath(t *testing.T) {
	root := t.TempDir()
	release := filepath.Join(root, "releases", "1.2.1")
	current := filepath.Join(root, "current")
	if err := os.MkdirAll(release, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(release, current); err != nil {
		t.Fatal(err)
	}
	if exists, err := validateCurrentRelease(release, current); err != nil || !exists {
		t.Fatalf("같은 current 링크 = %v, %v", exists, err)
	}
	if err := os.Remove(current); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(current, []byte("operator owned\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := validateCurrentRelease(release, current); err == nil {
		t.Fatal("일반 current 파일을 허용했습니다")
	}
}

// 릴리스 내부에 current를 만들어 순환 구조가 생기는 것을 막는다.
func TestValidateCurrentReleaseRejectsLinkInsideRelease(t *testing.T) {
	release := t.TempDir()
	if _, err := validateCurrentRelease(release, filepath.Join(release, ".current")); err == nil {
		t.Fatal("릴리스 내부 current 링크를 허용했습니다")
	}
}
