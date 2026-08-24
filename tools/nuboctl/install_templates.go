package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

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
	lifecycle, err := lifecycleDropInFiles(options.releaseDir, options.systemdDir)
	if err != nil {
		return nil, err
	}
	files = append(files, lifecycle...)
	return files, nil
}
