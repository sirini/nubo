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
		printSuccess("미리보기가 끝났습니다. DB와 실행 중인 서비스는 바꾸지 않았습니다.")
		return nil
	}
	if preflight.databaseChange {
		if options.nonInteractive && !options.backupConfirmed {
			return fmt.Errorf("GOAPI가 바뀌는 자동 업데이트에는 --backup-confirmed가 필요합니다")
		}
		confirmed := options.backupConfirmed
		if !confirmed && options.confirmBackup != nil {
			confirmed, err = options.confirmBackup()
			if err != nil {
				return fmt.Errorf("백업 확인 입력 실패: %w", err)
			}
		}
		if !confirmed {
			printWarning("업데이트를 취소했습니다. DB와 실행 중인 서비스는 바꾸지 않았습니다.")
			return nil
		}
	}
	lifecycle, err := lifecycleDropInFiles(preflight.candidateDir, options.systemdDir)
	if err != nil {
		return err
	}
	if err := installLifecycleDropIns(lifecycle); err != nil {
		return fmt.Errorf("NUBO lifecycle 설정 설치 실패: %w", err)
	}
	if output, reloadErr := runner.run("systemctl", "daemon-reload"); reloadErr != nil {
		return fmt.Errorf("NUBO lifecycle 설정 반영 실패: %s", compactOutput(output, reloadErr))
	}
	if preflight.databaseChange {
		if err := installDatabaseRelease(preflight.candidateDir, options.envFile, options.serviceUser, runner); err != nil {
			return fmt.Errorf("후보 릴리스 migration: %w", err)
		}
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
	if err := ensureNuboctlCommandLink(options.commandLink, options.currentLink); err != nil {
		return recoverPreviousRelease(options, preflight, environment, runner, readiness, fmt.Errorf("nuboctl 명령 등록 실패: %w", err))
	}
	if err := restartNuboServices(runner); err != nil {
		return recoverPreviousRelease(options, preflight, environment, runner, readiness, err)
	}
	if err := readiness(preflight.readinessURL); err != nil {
		return recoverPreviousRelease(options, preflight, environment, runner, readiness, fmt.Errorf("새 릴리스 readiness 실패: %w", err))
	}
	printSuccess("NUBO 업데이트 완료: %s → %s", preflight.previousVersion, preflight.candidateVersion)
	printItem("현재 버전", "%s → %s", options.currentLink, preflight.candidateDir)
	return nil
}

// update가 실제로 변경할 경계와 되돌리지 않는 DB 변경을 보여준다.
func printUpdatePlan(options updateOptions, preflight updatePreflight) {
	printHeading("업데이트 계획  %s → %s", preflight.previousVersion, preflight.candidateVersion)
	printItem("현재", "%s", preflight.previousDir)
	printItem("새 버전", "%s", preflight.candidateDir)
	if preflight.databaseChange {
		printItem("바꿀 것", "서비스 lifecycle 연결, DB 구조 갱신, 버전 전환, 서비스 재시작, 정상 동작 확인")
		printItem("직접 확인", "DB와 업로드 파일의 외부 백업")
	} else {
		printItem("바꿀 것", "서비스 lifecycle 연결, 버전 전환, 서비스 재시작, 정상 동작 확인")
		printItem("그대로", "GOAPI 출처와 DB 구조가 같아 migration·백업 확인을 생략합니다")
	}
	if preflight.databaseChange {
		printItem("실패하면", "이전 버전과 서비스를 복구합니다. DB 구조 갱신은 유지됩니다")
	} else {
		printItem("실패하면", "이전 버전과 서비스를 복구합니다")
	}
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
	migrationNote := ""
	if preflight.databaseChange {
		migrationNote = "; DB migration은 유지됩니다"
	}
	if err := replaceCurrentRelease(options.currentLink, preflight.candidateDir, preflight.previousDir); err != nil {
		if !currentReleaseIs(options.currentLink, preflight.previousDir) {
			return fmt.Errorf("%v; 이전 current 복원도 실패했습니다: %w%s", cause, err, migrationNote)
		}
	}
	if err := restoreRuntimeEnvironment(options.envFile, environment); err != nil {
		if !environmentFileIs(options.envFile, environment.previous) {
			return fmt.Errorf("%v; 이전 링크는 복원했지만 환경 파일 복구 실패: %w%s", cause, err, migrationNote)
		}
	}
	if err := restartNuboServices(runner); err != nil {
		return fmt.Errorf("%v; 이전 링크는 복원했지만 서비스 복구 실패: %w%s", cause, err, migrationNote)
	}
	if err := readiness(preflight.readinessURL); err != nil {
		return fmt.Errorf("%v; 이전 링크와 서비스를 복원했지만 readiness 실패: %w%s", cause, err, migrationNote)
	}
	return fmt.Errorf("%v; 이전 릴리스 %s로 복구했습니다%s", cause, preflight.previousVersion, migrationNote)
}

// current가 오류 뒤에도 기대한 실제 디렉터리를 가리키는지 확인한다.
func currentReleaseIs(currentLink, expectedDir string) bool {
	actual, err := resolveCurrentRelease(currentLink)
	return err == nil && actual == expectedDir
}
