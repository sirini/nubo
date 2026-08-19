package main

import (
	"bufio"
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// 현재 update가 자동 반영하지 않는 운영 템플릿 변경을 차단한다.
func validateCandidateTemplates(previousDir, candidateDir string) error {
	for _, relative := range []string{
		"share/systemd/nubo.target",
		"share/systemd/nubo-goapi.service.in",
		"share/systemd/nubo-web.service.in",
		"share/nginx/nubo.conf.in",
	} {
		previous, err := os.ReadFile(filepath.Join(previousDir, relative))
		if err != nil {
			return err
		}
		candidate, err := os.ReadFile(filepath.Join(candidateDir, relative))
		if err != nil {
			return err
		}
		if !bytes.Equal(previous, candidate) {
			return fmt.Errorf("후보의 운영 템플릿이 변경되어 자동 update할 수 없습니다: %s", relative)
		}
	}
	return nil
}

// 설치된 두 unit이 current 링크를 사용하고 Node.js가 지원 범위인지 확인한다.
func validateUpdateUnits(options updateOptions, runner commandRunner) error {
	goapi, err := readUnitDirectives(filepath.Join(options.systemdDir, "nubo-goapi.service"))
	if err != nil {
		return fmt.Errorf("GOAPI unit 확인 실패: %w", err)
	}
	web, err := readUnitDirectives(filepath.Join(options.systemdDir, "nubo-web.service"))
	if err != nil {
		return fmt.Errorf("Nuxt unit 확인 실패: %w", err)
	}
	if goapi["ExecStart"] != filepath.Join(options.currentLink, "bin", "goapi") {
		return fmt.Errorf("GOAPI unit이 current 링크를 참조하지 않습니다")
	}
	if goapi["User"] != options.serviceUser || web["User"] != options.serviceUser {
		return fmt.Errorf("systemd 서비스 사용자와 update 실행 사용자가 다릅니다")
	}
	if web["WorkingDirectory"] != filepath.Join(options.currentLink, "web") {
		return fmt.Errorf("Nuxt unit이 current 링크를 참조하지 않습니다")
	}
	fields := strings.Fields(web["ExecStart"])
	entrypoint := filepath.Join(options.currentLink, "web", ".output", "server", "index.mjs")
	if len(fields) < 2 || fields[len(fields)-1] != entrypoint {
		return fmt.Errorf("Nuxt unit이 current entrypoint를 참조하지 않습니다")
	}
	if _, err := resolveNodeBinary(fields[0], runner); err != nil {
		return err
	}
	return nil
}

// 단순 systemd unit의 마지막 key=value 지시어를 읽는다.
func readUnitDirectives(path string) (map[string]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	directives := make(map[string]string)
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "[") {
			continue
		}
		key, value, found := strings.Cut(line, "=")
		if found {
			directives[strings.TrimSpace(key)] = strings.TrimSpace(value)
		}
	}
	return directives, scanner.Err()
}
