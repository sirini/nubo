package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type updatePreflight struct {
	previousDir      string
	candidateDir     string
	previousVersion  string
	candidateVersion string
	readinessURL     string
	versionValues    map[string]string
	databaseChange   bool
}

// 현재 설치와 후보 릴리스가 안전한 update 전제조건을 만족하는지 확인한다.
func preflightUpdate(options updateOptions, runner commandRunner, readiness func(string) error) (updatePreflight, error) {
	previousDir, err := resolveCurrentRelease(options.currentLink)
	if err != nil {
		return updatePreflight{}, err
	}
	info, err := os.Lstat(options.candidateDir)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return updatePreflight{}, fmt.Errorf("후보 릴리스는 실제 버전 디렉터리여야 합니다: %s", options.candidateDir)
	}
	candidateDir, err := filepath.EvalSymlinks(options.candidateDir)
	if err != nil {
		return updatePreflight{}, err
	}
	if candidateDir == previousDir {
		return updatePreflight{}, fmt.Errorf("후보 릴리스가 현재 릴리스와 같습니다: %s", candidateDir)
	}
	if filepath.Dir(candidateDir) != filepath.Dir(previousDir) {
		return updatePreflight{}, fmt.Errorf("후보 릴리스는 현재 릴리스와 같은 releases 디렉터리에 있어야 합니다")
	}
	if err := validateInstallRelease(previousDir); err != nil {
		return updatePreflight{}, fmt.Errorf("현재 릴리스 검증 실패: %w", err)
	}
	if err := validateInstallRelease(candidateDir); err != nil {
		return updatePreflight{}, fmt.Errorf("후보 릴리스 검증 실패: %w", err)
	}
	if err := validateCandidateTemplates(previousDir, candidateDir); err != nil {
		return updatePreflight{}, err
	}
	previousManifest, _ := readManifest(previousDir)
	candidateManifest, _ := readManifest(candidateDir)
	if err := requireNewerRelease(previousManifest.ReleaseVersion, candidateManifest.ReleaseVersion); err != nil {
		return updatePreflight{}, err
	}
	versionValues, err := candidateVersionValues(candidateDir, candidateManifest)
	if err != nil {
		return updatePreflight{}, err
	}
	values, err := validateUpdateEnvironment(options, runner)
	if err != nil {
		return updatePreflight{}, err
	}
	if err := validateUpdateUnits(options, runner); err != nil {
		return updatePreflight{}, err
	}
	lifecycle, err := lifecycleDropInFiles(candidateDir, options.systemdDir)
	if err != nil {
		return updatePreflight{}, err
	}
	if err := preflightInstallFiles(lifecycle); err != nil {
		return updatePreflight{}, fmt.Errorf("NUBO lifecycle 설정 확인 실패: %w", err)
	}
	if _, err := validateNuboctlCommandLink(options.commandLink, options.currentLink); err != nil {
		return updatePreflight{}, err
	}
	if _, err := validateReleaseCommandLink(marketCommandLink(options.commandLink), options.currentLink, "nubo-market"); err != nil {
		return updatePreflight{}, err
	}
	if !commandExists(runner, "systemctl") {
		return updatePreflight{}, fmt.Errorf("서비스 전환에 필요한 systemctl을 찾을 수 없습니다")
	}
	endpoint := webBaseURL(options.baseOptions(), values) + "/ready"
	if err := readiness(endpoint); err != nil {
		return updatePreflight{}, fmt.Errorf("현재 릴리스 readiness 실패: %w", err)
	}
	return updatePreflight{
		previousDir: previousDir, candidateDir: candidateDir,
		previousVersion: previousManifest.ReleaseVersion, candidateVersion: candidateManifest.ReleaseVersion,
		readinessURL: endpoint, versionValues: versionValues,
		databaseChange: databaseChangeRequired(previousManifest, candidateManifest),
	}, nil
}

// GOAPI 출처가 완전히 같을 때는 같은 멱등 migration과 백업 확인을 반복하지 않는다.
func databaseChangeRequired(previous, candidate releaseManifest) bool {
	oldComponent, oldOK := previous.Components["goapi"]
	newComponent, newOK := candidate.Components["goapi"]
	return !oldOK || !newOK || oldComponent.Commit == "" || newComponent.Commit == "" || oldComponent.Commit != newComponent.Commit
}

// 후보 sample과 manifest에서 런타임 버전 표시에 쓸 값을 검증한다.
func candidateVersionValues(candidateDir string, manifest releaseManifest) (map[string]string, error) {
	values, err := readEnvironment(filepath.Join(candidateDir, "share", "env.sample"))
	if err != nil {
		return nil, err
	}
	versions := map[string]string{
		"NUXT_PUBLIC_VERSION": strings.TrimSpace(values["NUXT_PUBLIC_VERSION"]),
		"GOAPI_VERSION":       strings.TrimSpace(values["GOAPI_VERSION"]),
	}
	if versions["NUXT_PUBLIC_VERSION"] != manifest.ReleaseVersion {
		return nil, fmt.Errorf("후보 NUXT_PUBLIC_VERSION이 manifest와 다릅니다")
	}
	if versions["GOAPI_VERSION"] == "" {
		return nil, fmt.Errorf("후보 GOAPI_VERSION이 비어 있습니다")
	}
	if component, ok := manifest.Components["goapi"]; ok && component.Version != versions["GOAPI_VERSION"] {
		return nil, fmt.Errorf("후보 GOAPI_VERSION이 manifest component와 다릅니다")
	}
	return versions, nil
}

// update 진단에 공용 환경·상태 옵션을 제공한다.
func (update updateOptions) baseOptions() options {
	return options{envFile: update.envFile, stateDir: update.stateDir, serviceUser: update.serviceUser, webURL: update.webURL}
}

// 환경 설정과 업로드 권한이 현재 설치 계약을 만족하는지 확인한다.
func validateUpdateEnvironment(update updateOptions, runner commandRunner) (map[string]string, error) {
	base := update.baseOptions()
	results, values := checkEnvironment(base, true)
	for _, result := range results {
		if result.level == levelFail {
			return nil, fmt.Errorf("%s: %s", result.name, result.detail)
		}
	}
	if values == nil {
		return nil, fmt.Errorf("환경 파일을 읽을 수 없습니다: %s", update.envFile)
	}
	if result := checkUpload(base, values, runner); result.level == levelFail {
		return nil, fmt.Errorf("%s: %s", result.name, result.detail)
	}
	return values, nil
}

// major.minor.patch 버전만 허용하고 후보가 더 높은지 비교한다.
func requireNewerRelease(previous, candidate string) error {
	oldParts, err := numericVersion(previous)
	if err != nil {
		return fmt.Errorf("현재 릴리스 버전: %w", err)
	}
	newParts, err := numericVersion(candidate)
	if err != nil {
		return fmt.Errorf("후보 릴리스 버전: %w", err)
	}
	for index := range oldParts {
		if newParts[index] > oldParts[index] {
			return nil
		}
		if newParts[index] < oldParts[index] {
			break
		}
	}
	return fmt.Errorf("update 후보 버전은 현재보다 높아야 합니다: %s -> %s", previous, candidate)
}

func numericVersion(version string) ([3]int, error) {
	var parsed [3]int
	parts := strings.Split(strings.TrimPrefix(version, "v"), ".")
	if len(parts) != 3 {
		return parsed, fmt.Errorf("major.minor.patch 형식이 아닙니다: %s", version)
	}
	for index, part := range parts {
		value, err := strconv.Atoi(part)
		if err != nil || value < 0 {
			return parsed, fmt.Errorf("major.minor.patch 형식이 아닙니다: %s", version)
		}
		parsed[index] = value
	}
	return parsed, nil
}
