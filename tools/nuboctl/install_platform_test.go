package main

import (
	"os"
	"path/filepath"
	"testing"
)

// 지원하지 않는 배포판에서 설치를 막는다.
func TestInstallPlatformRejectsUnsupportedDistribution(t *testing.T) {
	path := filepath.Join(t.TempDir(), "os-release")
	if err := os.WriteFile(path, []byte("ID=debian\nVERSION_ID=13\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := validateInstallPlatform(path); err == nil {
		t.Fatal("공식 지원 대상이 아닌 배포판을 install이 허용했습니다")
	}
}

// Ubuntu 최소 버전만 적용하고 이후 릴리스를 허용한다.
func TestInstallPlatformEnforcesUbuntuMinimumVersion(t *testing.T) {
	path := filepath.Join(t.TempDir(), "os-release")
	if err := os.WriteFile(path, []byte("ID=ubuntu\nVERSION_ID=22.04\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := validateInstallPlatform(path); err != nil {
		t.Fatalf("Ubuntu 22.04를 거부했습니다: %v", err)
	}

	if err := os.WriteFile(path, []byte("ID=ubuntu\nVERSION_ID=26.04\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := validateInstallPlatform(path); err != nil {
		t.Fatalf("새 Ubuntu를 거부했습니다: %v", err)
	}

	if err := os.WriteFile(path, []byte("ID=ubuntu\nVERSION_ID=21.10\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := validateInstallPlatform(path); err == nil {
		t.Fatal("Ubuntu 22.04 미만을 허용했습니다")
	}
}
