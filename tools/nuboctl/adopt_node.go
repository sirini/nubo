package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const adoptionNodePath = "/opt/nubo/runtime/node"

func nodeNeedsStaging(path string) bool {
	resolved, err := filepath.EvalSymlinks(path)
	if err == nil {
		path = resolved
	}
	return strings.HasPrefix(path, "/home/") || strings.HasPrefix(path, "/root/")
}

// ProtectHome=true인 systemd에서도 NVM Node를 실행할 수 있도록 안정 경로에 복사한다.
func stageAdoptionNode(source string) (string, bool, error) {
	if !nodeNeedsStaging(source) {
		return source, false, nil
	}
	resolved, err := filepath.EvalSymlinks(source)
	if err != nil {
		return "", false, fmt.Errorf("Node.js 실제 경로 확인 실패: %w", err)
	}
	if _, err := os.Lstat(adoptionNodePath); err == nil {
		return "", false, fmt.Errorf("systemd용 Node.js 경로가 이미 있습니다: %s", adoptionNodePath)
	} else if !os.IsNotExist(err) {
		return "", false, err
	}
	contents, err := os.ReadFile(resolved)
	if err != nil {
		return "", false, err
	}
	if err := ensureInstallDirectory(filepath.Dir(adoptionNodePath), 0o755, 0, 0); err != nil {
		return "", false, err
	}
	file := installFile{path: adoptionNodePath, content: contents, mode: 0o755, uid: 0, gid: 0, label: "Node.js runtime"}
	if err := installFileIfNeeded(file); err != nil {
		return "", false, err
	}
	return adoptionNodePath, true, nil
}

func removeStagedAdoptionNode(path string, created bool) {
	if created && path == adoptionNodePath {
		_ = os.Remove(path)
	}
}
