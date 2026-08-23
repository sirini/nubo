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
	return replaceReleaseLink(currentLink, nextDir, "current")
}

// 전환 직전의 정상 릴리스를 previous 링크로 기록해 정리와 수동 복구에서 보호한다.
func rememberPreviousRelease(currentLink, previousDir string) error {
	return replaceReleaseLink(filepath.Join(filepath.Dir(currentLink), "previous"), previousDir, "previous")
}

// 일반 파일은 덮어쓰지 않고 릴리스 포인터만 같은 디렉터리에서 원자적으로 교체한다.
func replaceReleaseLink(linkPath, targetDir, label string) error {
	targetDir, err := filepath.EvalSymlinks(targetDir)
	if err != nil {
		return err
	}
	if info, statErr := os.Lstat(linkPath); statErr == nil {
		if info.Mode()&os.ModeSymlink == 0 {
			return fmt.Errorf("%s 경로가 심볼릭 링크가 아닙니다: %s", label, linkPath)
		}
	} else if !os.IsNotExist(statErr) {
		return statErr
	}
	parent := filepath.Dir(linkPath)
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
	if err := os.Symlink(targetDir, temporaryPath); err != nil {
		return err
	}
	if err := os.Rename(temporaryPath, linkPath); err != nil {
		return fmt.Errorf("%s 원자적 전환 실패: %w", label, err)
	}
	if actual, err := resolveCurrentRelease(linkPath); err != nil || actual != targetDir {
		return fmt.Errorf("%s 전환 결과를 확인할 수 없습니다: %s", label, actual)
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
