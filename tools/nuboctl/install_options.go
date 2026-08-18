package main

import (
	"flag"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
)

type installOptions struct {
	options
	domain            string
	serviceGroup      string
	uploadDir         string
	nodeBinary        string
	webPort           int
	goapiPort         int
	goapiPath         string
	maxBodySize       string
	systemdDir        string
	nginxDir          string
	osReleaseFile     string
	dryRun            bool
	nonInteractive    bool
	envInput          string
	activateServices  bool
	environmentValues map[string]string
	confirm           func() (bool, error)
}

type installFile struct {
	path    string
	content []byte
	mode    os.FileMode
	uid     int
	gid     int
	label   string
}

var (
	domainLabelPattern = regexp.MustCompile(`^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`)
	namePattern        = regexp.MustCompile(`^[a-z_][a-z0-9_-]*$`)
	pathSegmentPattern = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)
	bodySizePattern    = regexp.MustCompile(`^[1-9][0-9]*[kKmMgG]?$`)
)

// 비대화형 설치 옵션을 읽고 모든 경로를 절대 경로로 정규화한다.
func parseInstallOptions(args []string) (installOptions, error) {
	defaults := installOptions{
		options: options{
			releaseDir:  detectReleaseDir(),
			envFile:     environmentFilePath(),
			stateDir:    "/var/lib/nubo",
			serviceUser: "nubo",
		},
		serviceGroup:     "nubo",
		webPort:          3000,
		goapiPort:        3006,
		goapiPath:        "goapi",
		maxBodySize:      "100m",
		systemdDir:       "/etc/systemd/system",
		nginxDir:         "/etc/nginx/sites-available",
		osReleaseFile:    "/etc/os-release",
		activateServices: true,
	}

	flags := flag.NewFlagSet("install", flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&defaults.domain, "domain", "", "서비스에 사용할 도메인")
	flags.StringVar(&defaults.releaseDir, "release", defaults.releaseDir, "압축 해제된 릴리스 디렉터리")
	flags.StringVar(&defaults.envFile, "env", defaults.envFile, "생성하거나 보존할 환경 파일")
	flags.StringVar(&defaults.stateDir, "state", defaults.stateDir, "상태 데이터 디렉터리")
	flags.StringVar(&defaults.uploadDir, "upload", "", "업로드 디렉터리")
	flags.StringVar(&defaults.serviceUser, "user", defaults.serviceUser, "서비스 실행 사용자")
	flags.StringVar(&defaults.serviceGroup, "group", defaults.serviceGroup, "서비스 실행 그룹")
	flags.StringVar(&defaults.nodeBinary, "node", "", "Node.js 실행 파일")
	flags.IntVar(&defaults.webPort, "web-port", defaults.webPort, "Nuxt 내부 포트")
	flags.IntVar(&defaults.goapiPort, "goapi-port", defaults.goapiPort, "GOAPI 내부 포트")
	flags.StringVar(&defaults.goapiPath, "goapi-path", defaults.goapiPath, "GOAPI 공개 경로")
	flags.StringVar(&defaults.maxBodySize, "max-body-size", defaults.maxBodySize, "Nginx 요청 본문 제한")
	flags.StringVar(&defaults.systemdDir, "systemd-dir", defaults.systemdDir, "systemd unit 출력 디렉터리")
	flags.StringVar(&defaults.nginxDir, "nginx-dir", defaults.nginxDir, "Nginx sites-available 디렉터리")
	flags.BoolVar(&defaults.dryRun, "dry-run", false, "파일을 변경하지 않고 계획만 출력")
	flags.BoolVar(&defaults.nonInteractive, "non-interactive", false, "질문 없이 옵션과 입력 파일만 사용")
	flags.StringVar(&defaults.envInput, "env-input", "", "비밀값을 포함한 비대화형 설치 입력 파일")
	if err := flags.Parse(args); err != nil {
		return installOptions{}, err
	}
	if flags.NArg() != 0 {
		return installOptions{}, fmt.Errorf("예상하지 못한 인자: %s", flags.Arg(0))
	}

	for _, item := range []*string{&defaults.releaseDir, &defaults.envFile, &defaults.stateDir, &defaults.systemdDir, &defaults.nginxDir} {
		absolute, err := filepath.Abs(*item)
		if err != nil {
			return installOptions{}, err
		}
		*item = absolute
	}
	if defaults.envInput != "" {
		absolute, err := filepath.Abs(defaults.envInput)
		if err != nil {
			return installOptions{}, err
		}
		defaults.envInput = absolute
	}
	if defaults.uploadDir == "" {
		defaults.uploadDir = filepath.Join(defaults.stateDir, "upload")
	} else if !filepath.IsAbs(defaults.uploadDir) {
		absolute, err := filepath.Abs(defaults.uploadDir)
		if err != nil {
			return installOptions{}, err
		}
		defaults.uploadDir = absolute
	}
	defaults.domain = strings.ToLower(defaults.domain)
	return defaults, nil
}

// 템플릿이나 시스템 명령에 전달하기 전에 사용자 입력 형식을 제한한다.
func validateInstallOptions(options installOptions) error {
	if err := validateDomain(options.domain); err != nil {
		return err
	}
	if !namePattern.MatchString(options.serviceUser) || !namePattern.MatchString(options.serviceGroup) {
		return fmt.Errorf("사용자와 그룹 이름 형식이 올바르지 않습니다")
	}
	if options.webPort < 1 || options.webPort > 65535 || options.goapiPort < 1 || options.goapiPort > 65535 || options.webPort == options.goapiPort {
		return fmt.Errorf("웹/GOAPI 포트는 서로 다른 1~65535 값이어야 합니다")
	}
	if !pathSegmentPattern.MatchString(options.goapiPath) {
		return fmt.Errorf("GOAPI 경로는 영문자, 숫자, _, -만 사용할 수 있습니다")
	}
	if !bodySizePattern.MatchString(options.maxBodySize) {
		return fmt.Errorf("Nginx 본문 제한 형식이 올바르지 않습니다: %s", options.maxBodySize)
	}
	for label, path := range map[string]string{
		"릴리스": options.releaseDir, "환경 파일": options.envFile, "상태": options.stateDir,
		"업로드": options.uploadDir, "systemd": options.systemdDir, "Nginx": options.nginxDir,
	} {
		if !filepath.IsAbs(path) {
			return fmt.Errorf("%s 경로는 절대 경로여야 합니다: %s", label, path)
		}
	}
	return nil
}

// scheme이나 포트가 없는 DNS 호스트 이름만 설치 도메인으로 허용한다.
func validateDomain(domain string) error {
	if domain == "" || len(domain) > 253 || net.ParseIP(domain) != nil || strings.ContainsAny(domain, "/:@") {
		return fmt.Errorf("--domain에 포트나 scheme 없는 유효한 도메인을 입력하세요")
	}
	for _, label := range strings.Split(strings.ToLower(domain), ".") {
		if !domainLabelPattern.MatchString(label) {
			return fmt.Errorf("유효하지 않은 도메인입니다: %s", domain)
		}
	}
	return nil
}

// 실제 설치를 검증한 Ubuntu amd64 환경으로 제한한다.
func validateInstallPlatform(osReleaseFile string) error {
	if runtime.GOOS != "linux" || runtime.GOARCH != "amd64" {
		return fmt.Errorf("install은 현재 Linux amd64에서만 지원됩니다")
	}
	values, err := readEnvironment(osReleaseFile)
	if err != nil {
		return fmt.Errorf("운영체제 확인 실패: %w", err)
	}
	if values["ID"] != "ubuntu" || (values["VERSION_ID"] != "22.04" && values["VERSION_ID"] != "24.04") {
		return fmt.Errorf("install은 현재 Ubuntu 22.04/24.04에서만 지원됩니다: %s %s", values["ID"], values["VERSION_ID"])
	}
	return nil
}
