package main

import (
	"fmt"
	"os"
	"path/filepath"
)

const lifecycleDropInName = "nubo-lifecycle.conf"

// 대표 unit의 restart를 GOAPI와 Web에 직접 전파할 drop-in 목록을 만든다.
func lifecycleDropInFiles(releaseDir, systemdDir string) ([]installFile, error) {
	contents, err := os.ReadFile(filepath.Join(releaseDir, "share", "systemd", lifecycleDropInName))
	if err != nil {
		return nil, fmt.Errorf("NUBO lifecycle drop-in을 읽을 수 없습니다: %w", err)
	}
	files := make([]installFile, 0, 2)
	for _, service := range []string{"nubo-goapi.service", "nubo-web.service"} {
		files = append(files, installFile{
			path:    filepath.Join(systemdDir, service+".d", lifecycleDropInName),
			content: contents,
			mode:    0o644,
			label:   service + " lifecycle drop-in",
		})
	}
	return files, nil
}

// drop-in 대상 디렉터리를 준비하고 기존 운영자 파일은 덮어쓰지 않는다.
func installLifecycleDropIns(files []installFile) error {
	for _, file := range files {
		if err := ensureInstallDirectory(filepath.Dir(file.path), 0o755, 0, 0); err != nil {
			return err
		}
		if err := installFileIfNeeded(file); err != nil {
			return err
		}
	}
	return nil
}

// 일반 설치 파일 목록에서 lifecycle drop-in만 골라낸다.
func filterLifecycleDropIns(files []installFile) []installFile {
	filtered := make([]installFile, 0, 2)
	for _, file := range files {
		if filepath.Base(file.path) == lifecycleDropInName {
			filtered = append(filtered, file)
		}
	}
	return filtered
}
