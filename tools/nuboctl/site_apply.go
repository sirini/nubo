package main

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
)

type siteApplyPreflight struct {
	previousDir  string
	candidateDir string
	version      string
	readinessURL string
	skinsHash    string
}

// 같은 공식 버전에서 만든 로컬 스킨 빌드로 Web을 원자적으로 전환한다.
func runSiteApply(options siteApplyOptions, runner commandRunner, readiness func(string) error, requireRoot bool) error {
	if requireRoot && !options.dryRun && currentEUID() != 0 {
		return fmt.Errorf("실제 skin apply는 root 권한이 필요합니다; 먼저 --dry-run으로 확인하세요")
	}
	if err := validateSupportedPlatform("skin apply", options.osReleaseFile); err != nil {
		return err
	}
	var lock *updateLock
	var err error
	if !options.dryRun {
		lock, err = acquireUpdateLock(options.currentLink)
		if err != nil {
			return err
		}
		defer lock.close()
	}
	preflight, err := preflightSiteApply(options, runner, readiness)
	if err != nil {
		return err
	}
	printSiteApplyPlan(options, preflight)
	if options.dryRun {
		fmt.Println("\nDRY-RUN 완료: current 링크와 서비스를 변경하지 않았습니다.")
		return nil
	}
	if err := replaceCurrentRelease(options.currentLink, preflight.previousDir, preflight.candidateDir); err != nil {
		return err
	}
	if err := restartNuboWeb(runner); err != nil {
		return recoverPreviousSiteBuild(options, preflight, runner, readiness, err)
	}
	if err := readiness(preflight.readinessURL); err != nil {
		return recoverPreviousSiteBuild(options, preflight, runner, readiness, fmt.Errorf("새 스킨 빌드 readiness 실패: %w", err))
	}
	fmt.Printf("\n로컬 스킨 적용 완료: NUBO %s · %s\n", preflight.version, preflight.skinsHash[:12])
	fmt.Printf("현재 릴리스: %s -> %s\n", options.currentLink, preflight.candidateDir)
	return nil
}

func preflightSiteApply(options siteApplyOptions, runner commandRunner, readiness func(string) error) (siteApplyPreflight, error) {
	previousDir, err := resolveCurrentRelease(options.currentLink)
	if err != nil {
		return siteApplyPreflight{}, err
	}
	info, err := os.Lstat(options.candidateDir)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return siteApplyPreflight{}, fmt.Errorf("파생 릴리스는 실제 디렉터리여야 합니다: %s", options.candidateDir)
	}
	candidateDir, err := filepath.EvalSymlinks(options.candidateDir)
	if err != nil {
		return siteApplyPreflight{}, err
	}
	if candidateDir == previousDir {
		return siteApplyPreflight{}, fmt.Errorf("파생 릴리스가 현재 릴리스와 같습니다")
	}
	if filepath.Dir(candidateDir) != filepath.Dir(previousDir) {
		return siteApplyPreflight{}, fmt.Errorf("파생 릴리스는 현재 릴리스와 같은 releases 디렉터리에 있어야 합니다")
	}
	if err := validateInstallRelease(previousDir); err != nil {
		return siteApplyPreflight{}, fmt.Errorf("현재 릴리스 검증 실패: %w", err)
	}
	if err := validateInstallRelease(candidateDir); err != nil {
		return siteApplyPreflight{}, fmt.Errorf("파생 릴리스 검증 실패: %w", err)
	}
	previous, _ := readManifest(previousDir)
	candidate, _ := readManifest(candidateDir)
	if candidate.SiteBuild == nil || candidate.SiteBuild.BaseVersion != candidate.ReleaseVersion || candidate.SiteBuild.SkinsHash == "" {
		return siteApplyPreflight{}, fmt.Errorf("로컬 스킨 빌드의 기반 버전 정보가 올바르지 않습니다")
	}
	if previous.ReleaseVersion != candidate.ReleaseVersion {
		return siteApplyPreflight{}, fmt.Errorf("현재 NUBO와 스킨 빌드의 기반 버전이 다릅니다: %s != %s", previous.ReleaseVersion, candidate.ReleaseVersion)
	}
	if err := validateSiteBase(previousDir, candidateDir, previous, candidate); err != nil {
		return siteApplyPreflight{}, err
	}
	if err := validateCandidateTemplates(previousDir, candidateDir); err != nil {
		return siteApplyPreflight{}, err
	}
	update := options.updateOptions()
	values, err := validateUpdateEnvironment(update, runner)
	if err != nil {
		return siteApplyPreflight{}, err
	}
	if err := validateUpdateUnits(update, runner); err != nil {
		return siteApplyPreflight{}, err
	}
	if !commandExists(runner, "systemctl") {
		return siteApplyPreflight{}, fmt.Errorf("서비스 전환에 필요한 systemctl을 찾을 수 없습니다")
	}
	endpoint := webBaseURL(update.baseOptions(), values) + "/ready"
	if err := readiness(endpoint); err != nil {
		return siteApplyPreflight{}, fmt.Errorf("현재 릴리스 readiness 실패: %w", err)
	}
	return siteApplyPreflight{previousDir: previousDir, candidateDir: candidateDir, version: candidate.ReleaseVersion, readinessURL: endpoint, skinsHash: candidate.SiteBuild.SkinsHash}, nil
}

// Web 이외의 실행 파일과 출처가 현재 공식 기반과 같은지 확인한다.
func validateSiteBase(previousDir, candidateDir string, previous, candidate releaseManifest) error {
	for _, component := range []string{"goapi", "nuboctl"} {
		left, leftOK := previous.Components[component]
		right, rightOK := candidate.Components[component]
		if !leftOK || !rightOK || left != right {
			return fmt.Errorf("파생 릴리스의 %s 출처가 현재 릴리스와 다릅니다", component)
		}
	}
	paths := []string{"bin/goapi", "nuboctl", "share/env.sample"}
	for _, library := range previous.NativeLibraries {
		for _, variant := range library.Variants {
			paths = append(paths, variant.Path)
		}
	}
	for _, relative := range paths {
		left, err := os.ReadFile(filepath.Join(previousDir, relative))
		if err != nil {
			return err
		}
		right, err := os.ReadFile(filepath.Join(candidateDir, relative))
		if err != nil {
			return err
		}
		if !bytes.Equal(left, right) {
			return fmt.Errorf("파생 릴리스가 Web 밖의 공식 파일을 변경했습니다: %s", relative)
		}
	}
	return nil
}

func printSiteApplyPlan(options siteApplyOptions, preflight siteApplyPreflight) {
	fmt.Printf("로컬 스킨 적용 계획 (NUBO %s)\n", preflight.version)
	fmt.Printf("- 현재: %s\n", preflight.previousDir)
	fmt.Printf("- 후보: %s\n", preflight.candidateDir)
	fmt.Printf("- 스킨 소스: %s\n", preflight.skinsHash)
	fmt.Printf("- 전환: %s\n", options.currentLink)
	fmt.Println("- 실행: 원자적 링크 전환, Web restart, 전체 readiness 확인")
	fmt.Println("- 변경하지 않음: GOAPI, DB, 업로드, 환경 파일, Nginx/TLS")
}

func restartNuboWeb(runner commandRunner) error {
	output, err := runner.run("systemctl", "restart", "nubo-web.service")
	if err != nil {
		return fmt.Errorf("NUBO Web restart 실패: %s", compactOutput(output, err))
	}
	return nil
}

func recoverPreviousSiteBuild(options siteApplyOptions, preflight siteApplyPreflight, runner commandRunner, readiness func(string) error, cause error) error {
	if err := replaceCurrentRelease(options.currentLink, preflight.candidateDir, preflight.previousDir); err != nil && !currentReleaseIs(options.currentLink, preflight.previousDir) {
		return fmt.Errorf("%v; 이전 current 복원도 실패했습니다: %w", cause, err)
	}
	if err := restartNuboWeb(runner); err != nil {
		return fmt.Errorf("%v; 이전 링크는 복원했지만 Web 복구 실패: %w", cause, err)
	}
	if err := readiness(preflight.readinessURL); err != nil {
		return fmt.Errorf("%v; 이전 링크와 Web을 복원했지만 readiness 실패: %w", cause, err)
	}
	return fmt.Errorf("%v; 이전 스킨 빌드로 복구했습니다", cause)
}
