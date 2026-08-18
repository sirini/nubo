package main

import "fmt"

// 검증과 백업 확인 뒤 migration·전환·readiness를 수행한다.
func runUpdate(options updateOptions, runner commandRunner, readiness func(string) error, requireRoot bool) error {
	if requireRoot && !options.dryRun && currentEUID() != 0 {
		return fmt.Errorf("실제 update는 root 권한이 필요합니다; 먼저 --dry-run으로 확인하세요")
	}
	if err := validateSupportedPlatform("update", options.osReleaseFile); err != nil {
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
	preflight, err := preflightUpdate(options, runner, readiness)
	if err != nil {
		return err
	}
	printUpdatePlan(options, preflight)
	if options.dryRun {
		fmt.Println("\nDRY-RUN 완료: DB, current 링크와 서비스를 변경하지 않았습니다.")
		return nil
	}
	confirmed := options.backupConfirmed
	if !confirmed && options.confirmBackup != nil {
		confirmed, err = options.confirmBackup()
		if err != nil {
			return fmt.Errorf("백업 확인 입력 실패: %w", err)
		}
	}
	if !confirmed {
		fmt.Println("\nupdate를 취소했습니다. DB, current 링크와 서비스를 변경하지 않았습니다.")
		return nil
	}
	if err := installDatabaseRelease(preflight.candidateDir, options.envFile, options.serviceUser, runner); err != nil {
		return fmt.Errorf("후보 릴리스 migration: %w", err)
	}
	environment, err := updateRuntimeVersions(options.envFile, preflight.versionValues)
	if err != nil {
		if !environmentFileIs(options.envFile, environment.previous) {
			if restoreErr := restoreRuntimeEnvironment(options.envFile, environment); restoreErr != nil {
				return fmt.Errorf("migration 후 런타임 버전 환경 갱신 실패: %v; 환경 복원도 실패: %w", err, restoreErr)
			}
		}
		return fmt.Errorf("migration은 완료됐지만 런타임 버전 환경 갱신 실패: %w", err)
	}
	if err := replaceCurrentRelease(options.currentLink, preflight.previousDir, preflight.candidateDir); err != nil {
		if currentReleaseIs(options.currentLink, preflight.candidateDir) {
			return recoverPreviousRelease(options, preflight, environment, runner, readiness, fmt.Errorf("current 전환 확인 실패: %w", err))
		}
		if restoreErr := restoreRuntimeEnvironment(options.envFile, environment); restoreErr != nil {
			return fmt.Errorf("migration 후 릴리스 전환 실패: %v; 환경 복원도 실패: %w", err, restoreErr)
		}
		return fmt.Errorf("migration은 완료됐지만 릴리스 전환 실패: %w", err)
	}
	if err := restartNuboServices(runner); err != nil {
		return recoverPreviousRelease(options, preflight, environment, runner, readiness, err)
	}
	if err := readiness(preflight.readinessURL); err != nil {
		return recoverPreviousRelease(options, preflight, environment, runner, readiness, fmt.Errorf("새 릴리스 readiness 실패: %w", err))
	}
	fmt.Printf("\nNUBO update 완료: %s -> %s\n", preflight.previousVersion, preflight.candidateVersion)
	fmt.Printf("현재 릴리스: %s -> %s\n", options.currentLink, preflight.candidateDir)
	return nil
}

// update가 실제로 변경할 경계와 되돌리지 않는 DB 변경을 보여준다.
func printUpdatePlan(options updateOptions, preflight updatePreflight) {
	fmt.Printf("NUBO update 계획 (%s -> %s)\n", preflight.previousVersion, preflight.candidateVersion)
	fmt.Printf("- 현재: %s\n", preflight.previousDir)
	fmt.Printf("- 후보: %s\n", preflight.candidateDir)
	fmt.Printf("- 전환: %s\n", options.currentLink)
	fmt.Println("- 실행: additive DB migration, 런타임 버전 갱신, 원자적 링크 전환, 서비스 restart, readiness 확인")
	fmt.Println("- 실패 복구: 이전 환경·링크와 서비스 복원 (DB migration은 유지)")
	fmt.Println("- 제외: 릴리스 다운로드·압축 해제, DB·업로드 백업과 복원")
}

// 두 애플리케이션 서비스를 새 current 릴리스로 다시 시작한다.
func restartNuboServices(runner commandRunner) error {
	output, err := runner.run("systemctl", "restart", "nubo-goapi.service", "nubo-web.service")
	if err != nil {
		return fmt.Errorf("NUBO 서비스 restart 실패: %s", compactOutput(output, err))
	}
	return nil
}

// 이전 링크와 서비스를 복원하고 DB migration이 남는다는 오류를 반환한다.
func recoverPreviousRelease(options updateOptions, preflight updatePreflight, environment environmentTransition, runner commandRunner, readiness func(string) error, cause error) error {
	if err := replaceCurrentRelease(options.currentLink, preflight.candidateDir, preflight.previousDir); err != nil {
		if !currentReleaseIs(options.currentLink, preflight.previousDir) {
			return fmt.Errorf("%v; 이전 current 복원도 실패했습니다: %w; DB migration은 유지됩니다", cause, err)
		}
	}
	if err := restoreRuntimeEnvironment(options.envFile, environment); err != nil {
		if !environmentFileIs(options.envFile, environment.previous) {
			return fmt.Errorf("%v; 이전 링크는 복원했지만 환경 파일 복구 실패: %w; DB migration은 유지됩니다", cause, err)
		}
	}
	if err := restartNuboServices(runner); err != nil {
		return fmt.Errorf("%v; 이전 링크는 복원했지만 서비스 복구 실패: %w; DB migration은 유지됩니다", cause, err)
	}
	if err := readiness(preflight.readinessURL); err != nil {
		return fmt.Errorf("%v; 이전 링크와 서비스를 복원했지만 readiness 실패: %w; DB migration은 유지됩니다", cause, err)
	}
	return fmt.Errorf("%v; 이전 릴리스 %s로 복구했습니다. DB migration은 유지됩니다", cause, preflight.previousVersion)
}

// current가 오류 뒤에도 기대한 실제 디렉터리를 가리키는지 확인한다.
func currentReleaseIs(currentLink, expectedDir string) bool {
	actual, err := resolveCurrentRelease(currentLink)
	return err == nil && actual == expectedDir
}
