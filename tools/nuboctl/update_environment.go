package main

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
)

type environmentTransition struct {
	previous []byte
	current  []byte
}

// 외부 환경 파일의 빌드 버전 두 값만 바꾸고 복구용 원본을 반환한다.
func updateRuntimeVersions(path string, versions map[string]string) (environmentTransition, error) {
	original, err := os.ReadFile(path)
	if err != nil {
		return environmentTransition{}, err
	}
	transition := environmentTransition{previous: original, current: replaceEnvironmentValues(original, versions)}
	if err := replaceExistingFile(path, transition.current, transition.previous); err != nil {
		return transition, err
	}
	return transition, nil
}

// rollback 시 환경 파일을 update 직전 내용으로 원자적으로 복원한다.
func restoreRuntimeEnvironment(path string, transition environmentTransition) error {
	return replaceExistingFile(path, transition.previous, transition.current)
}

// 원자적 교체가 오류를 반환한 뒤에도 기대한 내용이 반영됐는지 확인한다.
func environmentFileIs(path string, expected []byte) bool {
	actual, err := os.ReadFile(path)
	return err == nil && string(actual) == string(expected)
}

// 기존 순서와 주석을 유지하고 지정한 환경값만 교체하거나 끝에 추가한다.
func replaceEnvironmentValues(content []byte, replacements map[string]string) []byte {
	lines := strings.Split(strings.TrimSuffix(string(content), "\n"), "\n")
	seen := make(map[string]bool, len(replacements))
	for index, line := range lines {
		key, _, found := strings.Cut(line, "=")
		key = strings.TrimSpace(key)
		if value, ok := replacements[key]; found && ok {
			lines[index] = key + "=" + value
			seen[key] = true
		}
	}
	for _, key := range []string{"GOAPI_VERSION", "NUXT_PUBLIC_VERSION"} {
		if !seen[key] {
			lines = append(lines, key+"="+replacements[key])
		}
	}
	return []byte(strings.Join(lines, "\n") + "\n")
}

// 기존 mode와 소유권을 보존해 같은 디렉터리에서 파일을 교체한다.
func replaceExistingFile(path string, content, expected []byte) error {
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	temporary, err := os.CreateTemp(filepath.Dir(path), ".nubo-env-*")
	if err != nil {
		return err
	}
	temporaryPath := temporary.Name()
	defer os.Remove(temporaryPath)
	if _, err := temporary.Write(content); err != nil {
		temporary.Close()
		return err
	}
	if err := temporary.Sync(); err != nil {
		temporary.Close()
		return err
	}
	if err := temporary.Chmod(info.Mode().Perm()); err != nil {
		temporary.Close()
		return err
	}
	if currentEUID() == 0 {
		stat, ok := info.Sys().(*syscall.Stat_t)
		if !ok {
			temporary.Close()
			return fmt.Errorf("환경 파일 소유권을 확인할 수 없습니다")
		}
		if err := temporary.Chown(int(stat.Uid), int(stat.Gid)); err != nil {
			temporary.Close()
			return err
		}
	}
	if err := temporary.Close(); err != nil {
		return err
	}
	current, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	if !bytes.Equal(current, expected) {
		return fmt.Errorf("환경 파일이 update 도중 변경되어 덮어쓰지 않습니다")
	}
	if err := os.Rename(temporaryPath, path); err != nil {
		return err
	}
	return syncDirectory(filepath.Dir(path))
}
