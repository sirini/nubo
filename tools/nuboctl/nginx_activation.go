package main

import (
	"flag"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

type nginxActivationOptions struct {
	envFile      string
	availableDir string
	enabledDir   string
	dryRun       bool
}

// Nginx 활성화에 필요한 환경 파일과 Ubuntu site 경로를 읽는다.
func parseNginxActivationOptions(args []string) (nginxActivationOptions, error) {
	options := nginxActivationOptions{
		envFile:      environmentFilePath(),
		availableDir: "/etc/nginx/sites-available",
		enabledDir:   "/etc/nginx/sites-enabled",
	}
	flags := flag.NewFlagSet("activate-nginx", flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&options.envFile, "env", options.envFile, "설치된 nubo.env 파일")
	flags.StringVar(&options.availableDir, "available-dir", options.availableDir, "Nginx sites-available 디렉터리")
	flags.StringVar(&options.enabledDir, "enabled-dir", options.enabledDir, "Nginx sites-enabled 디렉터리")
	flags.BoolVar(&options.dryRun, "dry-run", false, "변경 없이 활성화 계획만 출력")
	if err := flags.Parse(args); err != nil {
		return nginxActivationOptions{}, err
	}
	if flags.NArg() != 0 {
		return nginxActivationOptions{}, fmt.Errorf("예상하지 못한 인자: %s", flags.Arg(0))
	}
	for _, path := range []*string{&options.envFile, &options.availableDir, &options.enabledDir} {
		absolute, err := filepath.Abs(*path)
		if err != nil {
			return nginxActivationOptions{}, err
		}
		*path = absolute
	}
	return options, nil
}

// 설치 환경에 기록된 공개 URL에서 site 도메인을 복원한다.
func installedDomain(envFile string) (string, error) {
	values, err := readEnvironment(envFile)
	if err != nil {
		return "", fmt.Errorf("환경 파일 읽기 실패: %w", err)
	}
	publicURL := values["NUXT_PUBLIC_DOMAIN"]
	parsed, err := url.Parse(publicURL)
	if err != nil || parsed.Scheme != "https" || parsed.Hostname() == "" || parsed.Port() != "" || parsed.Path != "" || parsed.RawQuery != "" || parsed.Fragment != "" {
		return "", fmt.Errorf("NUXT_PUBLIC_DOMAIN은 포트와 경로 없는 https URL이어야 합니다: %s", publicURL)
	}
	domain := strings.ToLower(parsed.Hostname())
	if err := validateDomain(domain); err != nil {
		return "", err
	}
	return domain, nil
}

// 설치된 site만 연결하고 전체 설정 검증 뒤 Nginx를 활성화한다.
func activateNginx(options nginxActivationOptions, runner commandRunner, requireRoot bool) error {
	if requireRoot && !options.dryRun && currentEUID() != 0 {
		return fmt.Errorf("실제 Nginx 활성화는 root 권한이 필요합니다; 먼저 --dry-run으로 확인하세요")
	}
	domain, err := installedDomain(options.envFile)
	if err != nil {
		return err
	}
	fileName := "nubo-" + domain + ".conf"
	available := filepath.Join(options.availableDir, fileName)
	enabled := filepath.Join(options.enabledDir, fileName)
	if err := validateNginxSite(available, enabled, domain); err != nil {
		return err
	}
	alreadyEnabled, err := nginxSiteEnabled(available, enabled)
	if err != nil {
		return err
	}

	printHeading("웹 공개 계획  %s", domain)
	if alreadyEnabled {
		printItem("설정", "기존 연결 유지: %s", enabled)
	} else {
		printItem("설정", "%s → %s", enabled, available)
	}
	printItem("실행", "Nginx 설정 검사, 부팅 활성화, 시작 또는 다시 읽기")
	printItem("나중에", "HTTPS 인증서 발급과 자동 전환")
	if options.dryRun {
		printSuccess("미리보기가 끝났습니다. Nginx 설정과 서비스는 바꾸지 않았습니다.")
		return nil
	}
	if !commandExists(runner, "nginx") || !commandExists(runner, "systemctl") {
		return fmt.Errorf("Nginx 활성화에는 nginx와 systemctl 명령이 필요합니다")
	}
	created := false
	if !alreadyEnabled {
		if err := os.Symlink(available, enabled); err != nil {
			return fmt.Errorf("Nginx site 연결 실패: %w", err)
		}
		created = true
	}
	rollback := func() {
		if created {
			_ = os.Remove(enabled)
		}
	}
	if output, err := runner.run("nginx", "-t"); err != nil {
		rollback()
		return fmt.Errorf("Nginx 설정 검증 실패: %s", compactOutput(output, err))
	}
	_, activeErr := runner.run("systemctl", "is-active", "--quiet", "nginx.service")
	if output, err := runner.run("systemctl", "enable", "nginx.service"); err != nil {
		rollback()
		return fmt.Errorf("Nginx 부팅 활성화 실패: %s", compactOutput(output, err))
	}
	action := "reload"
	if activeErr != nil {
		action = "start"
	}
	if output, err := runner.run("systemctl", action, "nginx.service"); err != nil {
		rollback()
		return fmt.Errorf("Nginx %s 실패: %s", action, compactOutput(output, err))
	}

	printSuccess("HTTP 공개가 완료되었습니다: http://%s", domain)
	printItem("HTTPS 다음 단계", "sudo certbot --nginx -d %s --redirect", domain)
	return nil
}

// 설치기가 만든 일반 파일이며 대상 도메인을 포함하는지 확인한다.
func validateNginxSite(available, enabled, domain string) error {
	info, err := os.Lstat(available)
	if err != nil {
		return fmt.Errorf("설치된 Nginx site를 찾을 수 없습니다: %w", err)
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("Nginx site가 일반 파일이 아닙니다: %s", available)
	}
	contents, err := os.ReadFile(available)
	if err != nil {
		return err
	}
	if !nginxContainsDomain(string(contents), domain) {
		return fmt.Errorf("Nginx site가 설치 도메인 %s을 포함하지 않습니다: %s", domain, available)
	}
	if filepath.Dir(available) == filepath.Dir(enabled) {
		return fmt.Errorf("available/enabled 디렉터리는 서로 달라야 합니다")
	}
	if info, err := os.Stat(filepath.Dir(enabled)); err != nil || !info.IsDir() {
		return fmt.Errorf("Nginx enabled 디렉터리를 읽을 수 없습니다: %s", filepath.Dir(enabled))
	}
	return nil
}

// 기존 enabled 항목은 같은 site를 가리키는 심볼릭 링크만 허용한다.
func nginxSiteEnabled(available, enabled string) (bool, error) {
	info, err := os.Lstat(enabled)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if info.Mode()&os.ModeSymlink == 0 {
		return false, fmt.Errorf("기존 enabled 항목이 심볼릭 링크가 아닙니다: %s", enabled)
	}
	resolved, err := filepath.EvalSymlinks(enabled)
	if err != nil {
		return false, fmt.Errorf("기존 enabled 링크를 확인할 수 없습니다: %w", err)
	}
	expected, err := filepath.EvalSymlinks(available)
	if err != nil || resolved != expected {
		return false, fmt.Errorf("기존 enabled 링크가 다른 설정을 가리킵니다: %s", enabled)
	}
	return true, nil
}
