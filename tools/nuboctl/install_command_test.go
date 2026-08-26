package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestNuboctlCommandLinkIsIdempotentAndFollowsCurrent(t *testing.T) {
	root := t.TempDir()
	current := filepath.Join(root, "opt", "nubo", "current")
	command := filepath.Join(root, "usr", "local", "bin", "nuboctl")
	if err := ensureNuboctlCommandLink(command, current); err != nil {
		t.Fatal(err)
	}
	if err := ensureNuboctlCommandLink(command, current); err != nil {
		t.Fatalf("두 번째 명령 링크 생성이 멱등적이지 않습니다: %v", err)
	}
	target, err := os.Readlink(command)
	if err != nil || target != filepath.Join(current, "nuboctl") {
		t.Fatalf("명령 링크 = %s, %v", target, err)
	}
}

func TestNuboctlCommandLinkRefusesExistingPath(t *testing.T) {
	root := t.TempDir()
	current := filepath.Join(root, "current")
	command := filepath.Join(root, "bin", "nuboctl")
	if err := os.MkdirAll(filepath.Dir(command), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(command, []byte("operator owned\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	if _, err := validateNuboctlCommandLink(command, current); err == nil {
		t.Fatal("기존 일반 파일을 nuboctl 링크로 허용했습니다")
	}
	if err := os.Remove(command); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("/other/nuboctl", command); err != nil {
		t.Fatal(err)
	}
	if _, err := validateNuboctlCommandLink(command, current); err == nil {
		t.Fatal("다른 대상을 가리키는 링크를 허용했습니다")
	}
}

func TestMarketCommandLinkFollowsCurrent(t *testing.T) {
	root := t.TempDir()
	current := filepath.Join(root, "current")
	command := filepath.Join(root, "bin", "nubo-market")
	if err := ensureReleaseCommandLink(command, current, "nubo-market"); err != nil {
		t.Fatal(err)
	}
	target, err := os.Readlink(command)
	if err != nil || target != filepath.Join(current, "nubo-market") {
		t.Fatalf("Market 명령 링크 = %s, %v", target, err)
	}
}
