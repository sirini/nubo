package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var serverNamePattern = regexp.MustCompile(`\bserver_name\s+([^;{}]+);`)

// release 템플릿을 현재 서버 값으로 치환해 설치 대상 목록을 만든다.
func renderInstallFiles(options installOptions, tokens map[string]string, environment []byte, environmentExists bool) ([]installFile, error) {
	sources := []struct {
		source      string
		destination string
		label       string
	}{
		{"share/systemd/nubo.service", filepath.Join(options.systemdDir, "nubo.service"), "NUBO 대표 unit"},
		{"share/systemd/nubo.target", filepath.Join(options.systemdDir, "nubo.target"), "systemd target"},
		{"share/systemd/nubo-goapi.service.in", filepath.Join(options.systemdDir, "nubo-goapi.service"), "GOAPI unit"},
		{"share/systemd/nubo-web.service.in", filepath.Join(options.systemdDir, "nubo-web.service"), "Nuxt unit"},
	}
	if options.manageNginx {
		sources = append(sources, struct {
			source, destination, label string
		}{"share/nginx/nubo.conf.in", filepath.Join(options.nginxDir, "nubo-"+strings.ToLower(options.domain)+".conf"), "Nginx site"})
	}
	files := make([]installFile, 0, len(sources)+1)
	if !environmentExists {
		files = append(files, installFile{path: options.envFile, content: environment, mode: 0o640, label: "환경 파일"})
	}
	for _, source := range sources {
		contents, err := os.ReadFile(filepath.Join(options.releaseDir, source.source))
		if err != nil {
			return nil, err
		}
		rendered := string(contents)
		for token, value := range tokens {
			rendered = strings.ReplaceAll(rendered, token, value)
		}
		if strings.Contains(rendered, "@NUBO_") || strings.Contains(rendered, "@NODE_BINARY@") {
			return nil, fmt.Errorf("치환되지 않은 템플릿 값이 있습니다: %s", source.source)
		}
		files = append(files, installFile{path: source.destination, content: []byte(rendered), mode: 0o644, label: source.label})
	}
	return files, nil
}

// 대상 도메인을 이미 다루는 운영자 설정이 있으면 어떤 파일도 쓰기 전에 중단한다.
func protectExistingNginx(options installOptions, files []installFile) error {
	if !options.manageNginx {
		return nil
	}
	var expected installFile
	for _, file := range files {
		if file.label == "Nginx site" {
			expected = file
			break
		}
	}
	nginxRoot := filepath.Dir(options.nginxDir)
	if _, err := os.Stat(options.nginxDir); err != nil {
		return fmt.Errorf("Nginx 설정 디렉터리를 읽을 수 없습니다: %w", err)
	}
	return filepath.WalkDir(nginxRoot, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			return nil
		}
		contents, readErr := os.ReadFile(path)
		if readErr != nil {
			return readErr
		}
		if !nginxContainsDomain(string(contents), options.domain) {
			return nil
		}
		resolved, _ := filepath.EvalSymlinks(path)
		if (path == expected.path || resolved == expected.path) && string(contents) == string(expected.content) {
			return nil
		}
		return fmt.Errorf("기존 Nginx 설정이 도메인 %s을 사용합니다: %s", options.domain, path)
	})
}

// 주석을 제외한 server_name 중 대상 도메인을 포괄하는 항목을 찾는다.
func nginxContainsDomain(contents, domain string) bool {
	var uncommented strings.Builder
	for _, line := range strings.Split(contents, "\n") {
		uncommented.WriteString(strings.SplitN(line, "#", 2)[0])
		uncommented.WriteByte('\n')
	}
	for _, match := range serverNamePattern.FindAllStringSubmatch(uncommented.String(), -1) {
		for _, field := range strings.Fields(match[1]) {
			if nginxServerNameMatches(field, domain) {
				return true
			}
		}
	}
	return false
}

// exact, wildcard와 흔한 정규식 server_name의 도메인 포함 여부를 판정한다.
func nginxServerNameMatches(serverName, domain string) bool {
	serverName = strings.ToLower(serverName)
	domain = strings.ToLower(domain)
	if serverName == domain || serverName == "."+domain {
		return true
	}
	if strings.HasPrefix(serverName, "*.") {
		suffix := strings.TrimPrefix(serverName, "*")
		return strings.HasSuffix(domain, suffix) && domain != strings.TrimPrefix(suffix, ".")
	}
	return strings.HasPrefix(serverName, "~") && strings.Contains(strings.ReplaceAll(serverName, "\\", ""), domain)
}
