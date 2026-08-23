package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

const defaultNodeHeapOption = "--max-old-space-size=1536"

type sourceWorkflow struct {
	root   string
	script string
	args   []string
}

// 설치 후 사용자 명령을 현재 NUBO checkout의 준비 스크립트에 연결한다.
func prepareSourceWorkflow(command string, args []string, root string) (sourceWorkflow, error) {
	script := ""
	scriptArgs := append([]string(nil), args...)
	switch command {
	case "update":
		script = "prepare-release.mjs"
		scriptArgs = append([]string{"update"}, scriptArgs...)
	case "customize":
		script = "prepare-site-release.mjs"
	default:
		return sourceWorkflow{}, fmt.Errorf("지원하지 않는 소스 작업입니다: %s", command)
	}

	root, err := filepath.Abs(root)
	if err != nil {
		return sourceWorkflow{}, fmt.Errorf("프로젝트 경로를 확인할 수 없습니다: %w", err)
	}
	for _, path := range []string{filepath.Join(root, "package.json"), filepath.Join(root, "scripts", script)} {
		if info, statErr := os.Stat(path); statErr != nil || !info.Mode().IsRegular() {
			return sourceWorkflow{}, fmt.Errorf("NUBO 프로젝트 폴더에서 실행해 주세요: cd /path/to/nubo")
		}
	}
	return sourceWorkflow{root: root, script: filepath.Join(root, "scripts", script), args: scriptArgs}, nil
}

// Node 작업의 입출력을 그대로 연결해 다운로드와 빌드 진행 상황을 보여준다.
func runSourceWorkflow(command string, args []string) error {
	root := os.Getenv("NUBO_SOURCE_DIR")
	if root == "" {
		var err error
		root, err = os.Getwd()
		if err != nil {
			return fmt.Errorf("현재 폴더를 확인할 수 없습니다: %w", err)
		}
	}
	workflow, err := prepareSourceWorkflow(command, args, root)
	if err != nil {
		return err
	}
	node, err := exec.LookPath("node")
	if err != nil {
		return fmt.Errorf("Node.js를 찾을 수 없습니다. Node.js 22 이상을 설치해 주세요")
	}
	commandLine := exec.Command(node, append([]string{workflow.script}, workflow.args...)...)
	commandLine.Dir = workflow.root
	environment, defaultHeapApplied := sourceWorkflowEnvironment(os.Environ())
	commandLine.Env = environment
	commandLine.Stdin = os.Stdin
	commandLine.Stdout = os.Stdout
	commandLine.Stderr = os.Stderr
	if defaultHeapApplied {
		printItem("Node heap", "1536 MiB 기본값 · NODE_OPTIONS로 변경 가능")
	}
	if err := commandLine.Run(); err != nil {
		return fmt.Errorf("작업을 끝내지 못했습니다: %w", err)
	}
	return nil
}

// 운영자가 지정한 Node 옵션을 유지하면서 커스텀 Web 빌드에 필요한 heap 기본값만 보탠다.
func sourceWorkflowEnvironment(environment []string) ([]string, bool) {
	result := append([]string(nil), environment...)
	for index, entry := range result {
		key, value, found := strings.Cut(entry, "=")
		if !found || key != "NODE_OPTIONS" {
			continue
		}
		if hasNodeHeapOption(value) {
			return result, false
		}
		value = strings.TrimSpace(value)
		if value != "" {
			value += " "
		}
		result[index] = "NODE_OPTIONS=" + value + defaultNodeHeapOption
		return result, true
	}
	return append(result, "NODE_OPTIONS="+defaultNodeHeapOption), true
}

func hasNodeHeapOption(options string) bool {
	for _, option := range strings.Fields(options) {
		name, _, _ := strings.Cut(option, "=")
		if name == "--max-old-space-size" || name == "--max_old_space_size" {
			return true
		}
	}
	return false
}

func hasReleaseOption(args []string) bool {
	for _, argument := range args {
		if argument == "--release" || strings.HasPrefix(argument, "--release=") {
			return true
		}
	}
	return false
}

func requestsHelp(args []string) bool {
	for _, argument := range args {
		if argument == "--help" || argument == "-h" {
			return true
		}
	}
	return false
}
