package main

import (
	"fmt"
)

// 모든 입력과 기존 파일을 먼저 검사한 뒤 설치 준비 파일을 안전하게 생성한다.
func runInstall(options installOptions, runner commandRunner, requireRoot bool) error {
	if requireRoot && !options.dryRun && currentEUID() != 0 {
		return fmt.Errorf("실제 설치 준비는 root 권한이 필요합니다; 먼저 --dry-run으로 확인하세요")
	}
	if err := validateInstallOptions(options); err != nil {
		return err
	}
	if err := validateInstallPlatform(options.osReleaseFile); err != nil {
		return err
	}
	if err := validateInstallRelease(options.releaseDir); err != nil {
		return err
	}
	currentExists, err := validateCurrentRelease(options.releaseDir, options.currentLink)
	if err != nil {
		return err
	}
	commandExists, err := validateNuboctlCommandLink(options.commandLink, options.currentLink)
	if err != nil {
		return err
	}

	nodeBinary, err := resolveNodeBinary(options.nodeBinary, runner)
	if err != nil {
		return err
	}
	values, environmentContent, environmentExists, err := prepareInstallEnvironment(options)
	if err != nil {
		return err
	}
	if values != nil {
		options, err = applyEnvironmentToInstallOptions(options, values)
		if err != nil {
			return err
		}
		if err := validateInstallOptions(options); err != nil {
			if !environmentExists {
				return fmt.Errorf("설치 입력 파일: %w", err)
			}
			return fmt.Errorf("기존 환경 파일: %w", err)
		}
	}

	tokens := map[string]string{
		"@NUBO_USER@":         options.serviceUser,
		"@NUBO_GROUP@":        options.serviceGroup,
		"@NUBO_RELEASE_DIR@":  options.currentLink,
		"@NUBO_STATE_DIR@":    options.stateDir,
		"@NUBO_UPLOAD_DIR@":   options.uploadDir,
		"@NUBO_ENV_FILE@":     options.envFile,
		"@NUBO_PROTECT_HOME@": protectHomeForNode(nodeBinary),
		"@NODE_BINARY@":       nodeBinary,
	}

	files, err := renderInstallFiles(options, tokens, environmentContent, environmentExists)
	if err != nil {
		return err
	}
	if err := preflightInstallFiles(files); err != nil {
		return err
	}
	if err := validateExistingUploadDirectory(options, runner); err != nil {
		return err
	}

	printInstallPlan(options, files, environmentExists, currentExists, commandExists, nodeBinary)
	if options.dryRun {
		printSuccess("미리보기가 끝났습니다. 서버의 파일과 서비스는 바꾸지 않았습니다.")
		return nil
	}
	if options.confirm != nil {
		confirmed, err := options.confirm()
		if err != nil {
			return fmt.Errorf("설치 확인 입력 실패: %w", err)
		}
		if !confirmed {
			printWarning("설치를 취소했습니다. 서버의 파일과 서비스는 바꾸지 않았습니다.")
			return nil
		}
	}

	uid, gid, err := ensureServiceIdentity(options, runner)
	if err != nil {
		return err
	}
	if err := validateExistingUploadDirectory(options, runner); err != nil {
		return err
	}
	for index := range files {
		if files[index].path == options.envFile {
			files[index].uid = 0
			files[index].gid = gid
		}
	}
	if err := ensureInstallDirectory(configDirectory(options), 0o755, 0, 0); err != nil {
		return err
	}
	if err := ensureInstallDirectory(options.stateDir, 0o755, uid, gid); err != nil {
		return err
	}
	if err := ensureInstallDirectory(options.uploadDir, 0o755, uid, gid); err != nil {
		return err
	}
	if err := installLifecycleDropIns(filterLifecycleDropIns(files)); err != nil {
		return err
	}
	for _, file := range files {
		if err := installFileIfNeeded(file); err != nil {
			return err
		}
	}
	if err := installDatabase(options, runner); err != nil {
		return err
	}
	if err := ensureCurrentRelease(options.releaseDir, options.currentLink); err != nil {
		return err
	}
	if err := ensureNuboctlCommandLink(options.commandLink, options.currentLink); err != nil {
		return err
	}
	var environmentTransition environmentTransition
	environmentUpdated := false
	if environmentExists {
		manifest, err := readManifest(options.releaseDir)
		if err != nil {
			return err
		}
		versions, err := candidateVersionValues(options.releaseDir, manifest)
		if err != nil {
			return err
		}
		environmentTransition, err = updateRuntimeVersions(options.envFile, versions)
		if err != nil {
			return fmt.Errorf("기존 환경 파일의 런타임 버전 갱신 실패: %w", err)
		}
		environmentUpdated = true
	}
	if options.activateServices {
		if err := activateNuboServices(options, runner, waitForInstallReadiness); err != nil {
			if environmentUpdated {
				if restoreErr := restoreRuntimeEnvironment(options.envFile, environmentTransition); restoreErr != nil {
					return fmt.Errorf("%v; 환경 파일 복원도 실패: %w", err, restoreErr)
				}
			}
			return err
		}
	}

	printSuccess("NUBO 설치와 정상 동작 확인이 완료되었습니다.")
	printItem("관리자", "운영자 Nginx/HTTPS 설정 후 https://%s/auth/login", options.domain)
	return nil
}

// 생성·보존할 경로와 이번 단계에서 하지 않는 작업을 실행 전에 보여준다.
func printInstallPlan(options installOptions, files []installFile, environmentExists, currentExists, commandExists bool, nodeBinary string) {
	printHeading("NUBO 설치 계획  %s", options.domain)
	printItem("설치 파일", "%s", options.releaseDir)
	if currentExists {
		printItem("현재 버전", "기존 연결 유지: %s", options.currentLink)
	} else {
		printItem("현재 버전", "%s → %s", options.currentLink, options.releaseDir)
	}
	if commandExists {
		printItem("관리 명령", "기존 경로 유지: %s", options.commandLink)
	} else {
		printItem("관리 명령", "%s → %s/nuboctl", options.commandLink, options.currentLink)
	}
	printItem("Node.js", "%s", nodeBinary)
	printItem("데이터", "상태 %s · 업로드 %s", options.stateDir, options.uploadDir)
	printIdentityPlan(options)
	if environmentExists {
		printItem("환경 설정", "기존 운영값 유지 · 런타임 버전 갱신: %s", options.envFile)
	}
	for _, file := range files {
		if sameFileContent(file.path, file.content) {
			printItem("유지", "%s (%s)", file.path, file.label)
		} else {
			printItem("새 파일", "%s (%s)", file.path, file.label)
		}
	}
	printItem("실행", "DB 준비, 서비스 시작, 정상 동작 확인")
	printItem("그대로", "운영자 소유 Nginx/HTTPS 설정")
}
