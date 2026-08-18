package main

import (
	"fmt"
	"strconv"
)

// runInstall은 모든 입력과 기존 파일을 먼저 검사한 뒤 설치 준비 파일을 안전하게 생성한다.
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
		"@NUBO_USER@":          options.serviceUser,
		"@NUBO_GROUP@":         options.serviceGroup,
		"@NUBO_RELEASE_DIR@":   options.releaseDir,
		"@NUBO_STATE_DIR@":     options.stateDir,
		"@NUBO_UPLOAD_DIR@":    options.uploadDir,
		"@NUBO_ENV_FILE@":      options.envFile,
		"@NODE_BINARY@":        nodeBinary,
		"@NUBO_DOMAIN@":        options.domain,
		"@NUBO_WEB_PORT@":      strconv.Itoa(options.webPort),
		"@NUBO_GOAPI_PORT@":    strconv.Itoa(options.goapiPort),
		"@NUBO_GOAPI_PATH@":    options.goapiPath,
		"@NUBO_MAX_BODY_SIZE@": options.maxBodySize,
	}

	files, err := renderInstallFiles(options, tokens, environmentContent, environmentExists)
	if err != nil {
		return err
	}
	if err := protectExistingNginx(options, files); err != nil {
		return err
	}
	if err := preflightInstallFiles(files); err != nil {
		return err
	}
	if err := validateExistingUploadDirectory(options, runner); err != nil {
		return err
	}

	printInstallPlan(options, files, environmentExists, nodeBinary)
	if options.dryRun {
		fmt.Println("\nDRY-RUN 완료: 서버의 파일과 서비스를 변경하지 않았습니다.")
		return nil
	}
	if options.confirm != nil {
		confirmed, err := options.confirm()
		if err != nil {
			return fmt.Errorf("설치 확인 입력 실패: %w", err)
		}
		if !confirmed {
			fmt.Println("\n설치를 취소했습니다. 서버의 파일과 서비스를 변경하지 않았습니다.")
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
	for _, file := range files {
		if err := installFileIfNeeded(file); err != nil {
			return err
		}
	}

	fmt.Println("\n설치 준비가 완료되었습니다.")
	fmt.Println("환경 설정과 서비스 파일을 준비했습니다. nuboctl doctor로 실행 조건을 확인하세요.")
	fmt.Println("systemd와 Nginx 설정은 아직 활성화하거나 reload하지 않았습니다.")
	return nil
}

// printInstallPlan은 생성·보존할 경로와 이번 단계에서 하지 않는 작업을 실행 전에 보여준다.
func printInstallPlan(options installOptions, files []installFile, environmentExists bool, nodeBinary string) {
	fmt.Printf("NUBO 설치 준비 계획 (%s)\n", options.domain)
	fmt.Printf("- 릴리스: %s\n", options.releaseDir)
	fmt.Printf("- Node.js: %s\n", nodeBinary)
	fmt.Printf("- 상태/업로드: %s / %s\n", options.stateDir, options.uploadDir)
	printIdentityPlan(options)
	if environmentExists {
		fmt.Printf("- 환경 파일 보존: %s\n", options.envFile)
	}
	for _, file := range files {
		if sameFileContent(file.path, file.content) {
			fmt.Printf("- 유지: %s (%s)\n", file.path, file.label)
		} else {
			fmt.Printf("- 생성: %s (%s)\n", file.path, file.label)
		}
	}
	fmt.Println("- 제외: DB 준비, systemd 활성화/시작, Nginx enable/reload, TLS")
}
