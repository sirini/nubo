package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// current는 같은 릴리스를 가리키는 심볼릭 링크이거나 아직 없어야 한다.
func validateCurrentRelease(releaseDir, currentLink string) (bool, error) {
	releaseTarget, err := filepath.EvalSymlinks(releaseDir)
	if err != nil {
		return false, fmt.Errorf("릴리스 실제 경로 확인 실패: %w", err)
	}
	releaseTarget, err = filepath.Abs(releaseTarget)
	if err != nil {
		return false, err
	}
	if insidePath(releaseTarget, currentLink) {
		return false, fmt.Errorf("current 링크를 릴리스 내부에 둘 수 없습니다: %s", currentLink)
	}
	currentTarget, err := resolveCurrentRelease(currentLink)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if currentTarget != releaseTarget {
		return false, fmt.Errorf("current가 다른 릴리스를 가리킵니다: %s -> %s", currentLink, currentTarget)
	}
	return true, nil
}

// current 링크가 가리키는 실제 릴리스 디렉터리를 반환한다.
func resolveCurrentRelease(currentLink string) (string, error) {
	info, err := os.Lstat(currentLink)
	if err != nil {
		return "", err
	}
	if info.Mode()&os.ModeSymlink == 0 {
		return "", fmt.Errorf("current 경로가 심볼릭 링크가 아닙니다: %s", currentLink)
	}
	target, err := filepath.EvalSymlinks(currentLink)
	if err != nil {
		return "", fmt.Errorf("current 링크 확인 실패: %w", err)
	}
	target, err = filepath.Abs(target)
	if err != nil {
		return "", err
	}
	info, err = os.Stat(target)
	if err != nil || !info.IsDir() {
		return "", fmt.Errorf("current 대상이 릴리스 디렉터리가 아닙니다: %s", target)
	}
	return target, nil
}

// 검증된 릴리스의 실제 경로를 가리키는 current 링크를 충돌 없이 만든다.
func ensureCurrentRelease(releaseDir, currentLink string) error {
	exists, err := validateCurrentRelease(releaseDir, currentLink)
	if err != nil || exists {
		return err
	}
	if err := ensureInstallDirectory(filepath.Dir(currentLink), 0o755, 0, 0); err != nil {
		return fmt.Errorf("current 상위 경로 준비 실패: %w", err)
	}
	target, err := filepath.EvalSymlinks(releaseDir)
	if err != nil {
		return err
	}
	if err := os.Symlink(target, currentLink); err != nil {
		if same, validationErr := validateCurrentRelease(releaseDir, currentLink); validationErr == nil && same {
			return nil
		}
		return fmt.Errorf("current 링크 생성 실패: %w", err)
	}
	return nil
}

// child가 parent 자신 또는 내부 경로인지 lexical 기준으로 판정한다.
func insidePath(parent, child string) bool {
	relative, err := filepath.Rel(parent, child)
	return err == nil && relative != ".." && !filepath.IsAbs(relative) && !strings.HasPrefix(relative, ".."+string(filepath.Separator))
}
