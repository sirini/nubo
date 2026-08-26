package main

import (
	"fmt"
	"os"
	"path/filepath"
)

// PATH 링크가 없거나 현재 릴리스를 따르는 안전한 링크인지 확인한다.
func validateNuboctlCommandLink(commandLink, currentLink string) (bool, error) {
	return validateReleaseCommandLink(commandLink, currentLink, "nuboctl")
}

func validateReleaseCommandLink(commandLink, currentLink, name string) (bool, error) {
	target := filepath.Join(currentLink, name)
	info, err := os.Lstat(commandLink)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if info.Mode()&os.ModeSymlink == 0 {
		return false, fmt.Errorf("기존 %s 명령을 덮어쓰지 않습니다: %s", name, commandLink)
	}
	linked, err := os.Readlink(commandLink)
	if err != nil {
		return false, err
	}
	if !filepath.IsAbs(linked) {
		linked = filepath.Join(filepath.Dir(commandLink), linked)
	}
	if filepath.Clean(linked) != filepath.Clean(target) {
		return false, fmt.Errorf("기존 %s 링크가 다른 경로를 가리킵니다: %s -> %s", name, commandLink, linked)
	}
	return true, nil
}

// current 아래의 버전별 nuboctl을 항상 따라가는 PATH 링크를 만든다.
func ensureNuboctlCommandLink(commandLink, currentLink string) error {
	return ensureReleaseCommandLink(commandLink, currentLink, "nuboctl")
}

func ensureReleaseCommandLink(commandLink, currentLink, name string) error {
	if exists, err := validateReleaseCommandLink(commandLink, currentLink, name); err != nil || exists {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(commandLink), 0o755); err != nil {
		return err
	}
	if err := os.Symlink(filepath.Join(currentLink, name), commandLink); err != nil {
		if exists, validationErr := validateReleaseCommandLink(commandLink, currentLink, name); validationErr == nil && exists {
			return nil
		}
		return err
	}
	return syncDirectory(filepath.Dir(commandLink))
}

func marketCommandLink(nuboctlLink string) string {
	return filepath.Join(filepath.Dir(nuboctlLink), "nubo-market")
}
