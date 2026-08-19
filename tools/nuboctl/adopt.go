package main

import (
	"fmt"
	"net"
	"os"
	"os/user"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
)

// 기존 소스 설치를 보존하면서 공식 릴리스와 systemd 운영 체제로 전환한다.
func runAdopt(adopt adoptOptions, runner commandRunner, requireRoot bool) error {
	if requireRoot && !adopt.dryRun && currentEUID() != 0 {
		return fmt.Errorf("실제 adoption은 root 권한이 필요합니다; 먼저 --dry-run으로 확인하세요")
	}
	if err := validateAdoptDestination(adopt); err != nil {
		return err
	}
	values, domain, uploadDir, warnings, err := prepareAdoptedEnvironment(adopt.sourceDir)
	if err != nil {
		return err
	}
	serviceUser, serviceGroup, err := sourceIdentity(adopt.sourceDir)
	if err != nil {
		return err
	}
	install := installOptions{
		options: options{releaseDir: adopt.releaseDir, envFile: adopt.envFile, stateDir: adopt.stateDir, serviceUser: serviceUser},
		domain:  domain, serviceGroup: serviceGroup, currentLink: adopt.currentLink,
		uploadDir: uploadDir, nodeBinary: adopt.nodeBinary, webPort: 3000, goapiPort: 3006,
		goapiPath: "goapi", maxBodySize: "100m", systemdDir: adopt.systemdDir,
		nginxDir:      "/etc/nginx/sites-available",
		osReleaseFile: adopt.osReleaseFile, activateServices: true, manageNginx: false,
		environmentValues: values, dryRun: true,
	}
	install, err = applyEnvironmentToInstallOptions(install, values)
	if err != nil {
		return err
	}
	occupiedPorts := occupiedAdoptionPorts(install.webPort, install.goapiPort)
	printAdoptionIntroduction(adopt, install, warnings, occupiedPorts)
	if err := runInstall(install, runner, requireRoot); err != nil {
		return err
	}
	if adopt.dryRun {
		return nil
	}
	if len(occupiedPorts) > 0 {
		return fmt.Errorf("포트 %s을 사용 중인 프로세스가 있습니다; 기존 NUBO 프론트엔드·백엔드를 직접 종료한 뒤 다시 실행하세요", formatPorts(occupiedPorts))
	}
	if adopt.nonInteractive && !adopt.backupConfirmed {
		return fmt.Errorf("비대화형 adoption에는 --backup-confirmed가 필요합니다")
	}
	confirmed := adopt.backupConfirmed
	if !confirmed && adopt.confirmBackup != nil {
		confirmed, err = adopt.confirmBackup()
		if err != nil {
			return fmt.Errorf("백업 확인 입력 실패: %w", err)
		}
	}
	if !confirmed {
		fmt.Println("\nadoption을 취소했습니다. 서버의 파일과 서비스를 변경하지 않았습니다.")
		return nil
	}
	stagedNode, nodeCreated, err := stageAdoptionNode(install.nodeBinary)
	if err != nil {
		return err
	}
	install.nodeBinary = stagedNode
	install.dryRun = false
	if err := runInstall(install, runner, requireRoot); err != nil {
		_, _ = runner.run("systemctl", "disable", "--now", "nubo.target")
		rollbackAdoptionFiles(adopt)
		_, _ = runner.run("systemctl", "daemon-reload")
		removeStagedAdoptionNode(stagedNode, nodeCreated)
		return fmt.Errorf("새 서비스 전환 실패: %w; 기존 프로세스는 자동으로 재시작하지 않았으므로 필요하면 이전 실행 방식으로 직접 시작하세요", err)
	}
	if err := backupLegacyEnvironment(adopt.sourceDir, adopt.stateDir); err != nil {
		fmt.Printf("경고: 기존 환경 참고본을 만들지 못했습니다: %v (원본 .env는 그대로 유지됩니다)\n", err)
	}
	fmt.Println("\nadoption 완료: 이제 npm run server:update로 다음 버전을 적용할 수 있습니다.")
	fmt.Printf("기존 소스·.env·업로드·DB·Nginx는 삭제하거나 이동하지 않았습니다. 환경 참고본: %s\n", filepath.Join(adopt.stateDir, "adoption", "legacy.env"))
	return nil
}

func validateAdoptDestination(options adoptOptions) error {
	paths := map[string]string{"새 환경 파일": options.envFile, "current 링크": options.currentLink}
	for _, name := range []string{"nubo.target", "nubo-goapi.service", "nubo-web.service"} {
		paths["systemd unit "+name] = filepath.Join(options.systemdDir, name)
	}
	for label, path := range paths {
		if _, err := os.Lstat(path); err == nil {
			return fmt.Errorf("%s이 이미 있습니다: %s; 이미 adoption했다면 npm run server:update를 사용하세요", label, path)
		} else if !os.IsNotExist(err) {
			return err
		}
	}
	info, err := os.Stat(options.sourceDir)
	if err != nil || !info.IsDir() {
		return fmt.Errorf("기존 NUBO 소스 디렉터리를 읽을 수 없습니다: %s", options.sourceDir)
	}
	return nil
}

func rollbackAdoptionFiles(options adoptOptions) {
	for _, path := range []string{
		options.currentLink, options.envFile,
		filepath.Join(options.systemdDir, "nubo.target"),
		filepath.Join(options.systemdDir, "nubo-goapi.service"),
		filepath.Join(options.systemdDir, "nubo-web.service"),
	} {
		_ = os.Remove(path)
	}
}

func sourceIdentity(path string) (string, string, error) {
	info, err := os.Stat(path)
	if err != nil {
		return "", "", err
	}
	stat, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return "", "", fmt.Errorf("기존 소스 소유자를 확인할 수 없습니다")
	}
	account, err := user.LookupId(strconv.FormatUint(uint64(stat.Uid), 10))
	if err != nil {
		return "", "", err
	}
	group, err := user.LookupGroupId(strconv.FormatUint(uint64(stat.Gid), 10))
	if err != nil {
		return "", "", err
	}
	return account.Username, group.Name, nil
}

func printAdoptionIntroduction(adopt adoptOptions, install installOptions, warnings []string, occupiedPorts []int) {
	fmt.Println("NUBO v1.2.2 이후 운영 체제로 전환합니다.")
	fmt.Println("- 그대로 둠: 기존 프로젝트, .env, 업로드 파일, 데이터베이스, Nginx/TLS")
	fmt.Println("- 새로 만듦: 검증된 공식 릴리스, /etc 환경 파일, current 링크, systemd 서비스")
	fmt.Printf("- 서비스 계정: 기존 프로젝트 소유자 %s:%s\n", install.serviceUser, install.serviceGroup)
	if warning := adoptionIdentityWarning(install.serviceUser); warning != "" {
		fmt.Printf("- 주의: %s\n", warning)
	}
	fmt.Printf("- 업로드 위치 유지: %s\n", install.uploadDir)
	fmt.Println("- 프로세스 관리 방식(PM2, tmux, systemd 등)을 추측하거나 실행 중인 프로세스를 자동 종료하지 않습니다.")
	if len(occupiedPorts) > 0 {
		fmt.Printf("- 먼저 종료 필요: 포트 %s을 사용 중입니다. 기존 NUBO 프론트엔드·백엔드를 직접 종료하세요.\n", formatPorts(occupiedPorts))
	} else {
		fmt.Printf("- 포트 확인 완료: %d, %d을 사용할 수 있습니다.\n", install.webPort, install.goapiPort)
	}
	fmt.Println("- DB migration은 additive이며 자동 rollback 대상이 아니므로 외부 DB·업로드 백업이 필요합니다.")
	if len(warnings) > 0 {
		fmt.Printf("- 주의: 현재 체제에서 사용하지 않는 기존 메일 설정은 옮기지 않습니다: %s (Resend 설정을 확인하세요)\n", strings.Join(warnings, ", "))
	}
	fmt.Printf("- 기존 환경 참고본: %s\n\n", filepath.Join(adopt.stateDir, "adoption", "legacy.env"))
	if nodeNeedsStaging(install.nodeBinary) {
		fmt.Println("- Node.js가 홈 디렉터리에 있어 systemd용 안정 경로 /opt/nubo/runtime/node로 복사합니다.")
	}
}

func adoptionIdentityWarning(username string) string {
	if username == "root" {
		return "기존 운영 방식에 맞춰 root로 실행합니다. systemd 파일시스템 보호와 쓰기 경로 제한은 유지됩니다."
	}
	return ""
}

func occupiedAdoptionPorts(ports ...int) []int {
	occupied := make([]int, 0, len(ports))
	for _, port := range ports {
		listener, err := net.Listen("tcp", "127.0.0.1:"+strconv.Itoa(port))
		if err != nil {
			occupied = append(occupied, port)
			continue
		}
		_ = listener.Close()
	}
	return occupied
}

func formatPorts(ports []int) string {
	values := make([]string, 0, len(ports))
	for _, port := range ports {
		values = append(values, strconv.Itoa(port))
	}
	return strings.Join(values, ", ")
}
