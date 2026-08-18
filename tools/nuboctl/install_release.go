package main

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

// 현재 플랫폼과 필수 실행 파일·템플릿이 준비된 릴리스인지 확인한다.
func validateInstallRelease(releaseDir string) error {
	manifest, err := readManifest(releaseDir)
	if err != nil {
		return fmt.Errorf("릴리스 manifest: %w", err)
	}
	if manifest.Target.OS != runtime.GOOS || manifest.Target.Arch != runtime.GOARCH {
		return fmt.Errorf("현재 플랫폼과 릴리스 대상이 다릅니다")
	}
	if err := requireCPUFeature("/proc/cpuinfo", "sse4_2"); err != nil {
		return err
	}
	if err := verifyReleaseChecksums(releaseDir); err != nil {
		return fmt.Errorf("릴리스 checksum: %w", err)
	}
	if err := validateNativeLibrary(releaseDir, manifest.NativeLibraries["libvips"]); err != nil {
		return fmt.Errorf("내장 libvips: %w", err)
	}
	for _, relative := range []string{
		"bin/goapi", "web/.output/server/index.mjs", "share/env.sample",
		"share/systemd/nubo.target", "share/systemd/nubo-goapi.service.in",
		"share/systemd/nubo-web.service.in", "share/nginx/nubo.conf.in",
	} {
		if info, err := os.Stat(filepath.Join(releaseDir, relative)); err != nil || !info.Mode().IsRegular() {
			return fmt.Errorf("릴리스 필수 파일이 없습니다: %s", relative)
		}
	}
	return nil
}

// 지원 버전의 실행 가능한 Node.js 절대 경로를 찾는다.
func resolveNodeBinary(configured string, runner commandRunner) (string, error) {
	path := configured
	var err error
	if path == "" {
		path, err = runner.lookPath("node")
		if err != nil {
			return "", fmt.Errorf("Node.js 실행 파일을 찾을 수 없습니다")
		}
	}
	if !filepath.IsAbs(path) {
		return "", fmt.Errorf("Node.js 실행 파일은 절대 경로여야 합니다: %s", path)
	}
	if resolved, resolveErr := filepath.EvalSymlinks(path); resolveErr == nil {
		path = resolved
	}
	info, err := os.Stat(path)
	if err != nil || !info.Mode().IsRegular() || info.Mode().Perm()&0o111 == 0 {
		return "", fmt.Errorf("Node.js 실행 파일을 사용할 수 없습니다: %s", path)
	}
	output, err := runner.run(path, "--version")
	if err != nil {
		return "", fmt.Errorf("Node.js 버전 확인 실패: %s", compactOutput(output, err))
	}
	if err := validateNodeVersion(output); err != nil {
		return "", fmt.Errorf("Node.js: %w", err)
	}
	return path, nil
}
