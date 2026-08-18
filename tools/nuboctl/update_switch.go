package main

import (
	"fmt"
	"os"
	"path/filepath"
)

// current 링크를 같은 디렉터리의 임시 링크와 rename해 원자적으로 바꾼다.
func replaceCurrentRelease(currentLink, expectedDir, nextDir string) error {
	currentDir, err := resolveCurrentRelease(currentLink)
	if err != nil {
		return err
	}
	if currentDir != expectedDir {
		return fmt.Errorf("current가 preflight 이후 변경되었습니다: %s", currentDir)
	}
	nextDir, err = filepath.EvalSymlinks(nextDir)
	if err != nil {
		return err
	}
	parent := filepath.Dir(currentLink)
	temporary, err := os.CreateTemp(parent, ".nubo-current-*")
	if err != nil {
		return err
	}
	temporaryPath := temporary.Name()
	if err := temporary.Close(); err != nil {
		os.Remove(temporaryPath)
		return err
	}
	if err := os.Remove(temporaryPath); err != nil {
		return err
	}
	defer os.Remove(temporaryPath)
	if err := os.Symlink(nextDir, temporaryPath); err != nil {
		return err
	}
	if err := os.Rename(temporaryPath, currentLink); err != nil {
		return fmt.Errorf("current 원자적 전환 실패: %w", err)
	}
	if actual, err := resolveCurrentRelease(currentLink); err != nil || actual != nextDir {
		return fmt.Errorf("current 전환 결과를 확인할 수 없습니다: %s", actual)
	}
	return syncDirectory(parent)
}

// 링크 rename을 담은 디렉터리 metadata를 디스크에 반영한다.
func syncDirectory(path string) error {
	directory, err := os.Open(path)
	if err != nil {
		return err
	}
	defer directory.Close()
	return directory.Sync()
}
