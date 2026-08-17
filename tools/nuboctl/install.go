package main

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"flag"
	"fmt"
	"net"
	"net/url"
	"os"
	"os/user"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
)

type installOptions struct {
	options
	domain        string
	serviceGroup  string
	uploadDir     string
	nodeBinary    string
	webPort       int
	goapiPort     int
	goapiPath     string
	maxBodySize   string
	systemdDir    string
	nginxDir      string
	osReleaseFile string
	dryRun        bool
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
	serverNamePattern  = regexp.MustCompile(`\bserver_name\s+([^;{}]+);`)
)

func parseInstallOptions(args []string) (installOptions, error) {
	defaults := installOptions{
		options: options{
			releaseDir:  detectReleaseDir(),
			envFile:     environmentFilePath(),
			stateDir:    "/var/lib/nubo",
			serviceUser: "nubo",
		},
		serviceGroup:  "nubo",
		webPort:       3000,
		goapiPort:     3006,
		goapiPath:     "goapi",
		maxBodySize:   "100m",
		systemdDir:    "/etc/systemd/system",
		nginxDir:      "/etc/nginx/sites-available",
		osReleaseFile: "/etc/os-release",
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

func runInstall(options installOptions, runner commandRunner, requireRoot bool) error {
	if requireRoot && !options.dryRun && os.Geteuid() != 0 {
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
	if environmentExists {
		options, err = applyEnvironmentToInstallOptions(options, values)
		if err != nil {
			return err
		}
		if err := validateInstallOptions(options); err != nil {
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

	printInstallPlan(options, files, environmentExists, nodeBinary)
	if options.dryRun {
		fmt.Println("\nDRY-RUN 완료: 서버의 파일과 서비스를 변경하지 않았습니다.")
		return nil
	}

	uid, gid, err := ensureServiceIdentity(options, runner)
	if err != nil {
		return err
	}
	for index := range files {
		if files[index].path == options.envFile {
			files[index].uid = 0
			files[index].gid = gid
		}
	}
	if err := ensureInstallDirectory(filepath.Dir(options.envFile), 0o755, 0, 0); err != nil {
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
	fmt.Println("다음 단계: 환경 파일의 DB/관리자 값을 입력한 뒤 doctor를 다시 실행하세요.")
	fmt.Println("systemd와 Nginx 설정은 아직 활성화하거나 reload하지 않았습니다.")
	return nil
}

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

func validateInstallRelease(releaseDir string) error {
	manifest, err := readManifest(releaseDir)
	if err != nil {
		return fmt.Errorf("릴리스 manifest: %w", err)
	}
	if manifest.Target.OS != runtime.GOOS || manifest.Target.Arch != runtime.GOARCH {
		return fmt.Errorf("현재 플랫폼과 릴리스 대상이 다릅니다")
	}
	if err := verifyReleaseChecksums(releaseDir); err != nil {
		return fmt.Errorf("릴리스 checksum: %w", err)
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

func prepareInstallEnvironment(options installOptions) (map[string]string, []byte, bool, error) {
	if info, err := os.Stat(options.envFile); err == nil {
		if info.Mode().Perm()&0o007 != 0 || info.Mode().Perm()&0o020 != 0 {
			return nil, nil, true, fmt.Errorf("기존 환경 파일 권한이 안전하지 않습니다: %#o", info.Mode().Perm())
		}
		values, readErr := readEnvironment(options.envFile)
		return values, nil, true, readErr
	} else if !os.IsNotExist(err) {
		return nil, nil, false, err
	}

	jwtSecret, err := randomSecret()
	if err != nil {
		return nil, nil, false, err
	}
	syncSecret, err := randomSecret()
	if err != nil {
		return nil, nil, false, err
	}
	replacements := map[string]string{
		"GOAPI_BASE":             options.goapiPath,
		"GOAPI_HOST":             "127.0.0.1",
		"GOAPI_PORT":             strconv.Itoa(options.goapiPort),
		"GOAPI_DOMAIN":           "http://" + options.domain,
		"NUBO_UPLOAD_DIR":        options.uploadDir,
		"JWT_SECRET_KEY":         jwtSecret,
		"SYNC_SECRET_KEY":        syncSecret,
		"NITRO_HOST":             "127.0.0.1",
		"NITRO_PORT":             strconv.Itoa(options.webPort),
		"NUXT_API_BASE_INTERNAL": "http://127.0.0.1:" + strconv.Itoa(options.goapiPort) + "/" + options.goapiPath,
		"NUXT_PUBLIC_GOAPI_BASE": options.goapiPath,
		"NUXT_PUBLIC_DOMAIN":     "http://" + options.domain,
	}
	content, err := renderEnvironmentSample(filepath.Join(options.releaseDir, "share/env.sample"), replacements)
	return replacements, content, false, err
}

func randomSecret() (string, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", fmt.Errorf("비밀값 생성 실패: %w", err)
	}
	return hex.EncodeToString(value), nil
}

func renderEnvironmentSample(path string, replacements map[string]string) ([]byte, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	var output strings.Builder
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		key, _, found := strings.Cut(line, "=")
		if value, exists := replacements[key]; found && exists {
			line = key + "=" + value
		}
		output.WriteString(line)
		output.WriteByte('\n')
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return []byte(output.String()), nil
}

func applyEnvironmentToInstallOptions(options installOptions, values map[string]string) (installOptions, error) {
	for key, destination := range map[string]*int{"NITRO_PORT": &options.webPort, "GOAPI_PORT": &options.goapiPort} {
		value := strings.TrimSpace(values[key])
		if value == "" {
			continue
		}
		port, err := strconv.Atoi(value)
		if err != nil {
			return options, fmt.Errorf("기존 환경 파일의 %s 값이 올바르지 않습니다", key)
		}
		*destination = port
	}
	if path := strings.Trim(values["GOAPI_BASE"], "/"); path != "" {
		options.goapiPath = path
	}
	if upload := uploadDirectory(options.options, values); upload != "" {
		options.uploadDir = upload
	}
	for _, key := range []string{"GOAPI_DOMAIN", "NUXT_PUBLIC_DOMAIN"} {
		value := strings.TrimSpace(values[key])
		if value == "" || strings.HasPrefix(value, "#") {
			continue
		}
		parsed, err := url.Parse(value)
		if err != nil || parsed.Hostname() == "" || !strings.EqualFold(parsed.Hostname(), options.domain) {
			return options, fmt.Errorf("기존 환경 파일의 %s이 --domain과 다릅니다", key)
		}
	}
	return options, nil
}

func renderInstallFiles(options installOptions, tokens map[string]string, environment []byte, environmentExists bool) ([]installFile, error) {
	sources := []struct {
		source      string
		destination string
		label       string
	}{
		{"share/systemd/nubo.target", filepath.Join(options.systemdDir, "nubo.target"), "systemd target"},
		{"share/systemd/nubo-goapi.service.in", filepath.Join(options.systemdDir, "nubo-goapi.service"), "GOAPI unit"},
		{"share/systemd/nubo-web.service.in", filepath.Join(options.systemdDir, "nubo-web.service"), "Nuxt unit"},
		{"share/nginx/nubo.conf.in", filepath.Join(options.nginxDir, "nubo-"+strings.ToLower(options.domain)+".conf"), "Nginx site"},
	}
	files := make([]installFile, 0, len(sources)+1)
	if !environmentExists {
		files = append(files, installFile{path: options.envFile, content: environment, mode: 0o640, label: "환경 파일"})
	}
	for _, source := range sources {
		contents, err := os.ReadFile(filepath.Join(options.releaseDir, source.source))
		if err != nil {
			return nil, err
		}
		rendered := string(contents)
		for token, value := range tokens {
			rendered = strings.ReplaceAll(rendered, token, value)
		}
		if strings.Contains(rendered, "@NUBO_") || strings.Contains(rendered, "@NODE_BINARY@") {
			return nil, fmt.Errorf("치환되지 않은 템플릿 값이 있습니다: %s", source.source)
		}
		files = append(files, installFile{path: source.destination, content: []byte(rendered), mode: 0o644, label: source.label})
	}
	return files, nil
}

func protectExistingNginx(options installOptions, files []installFile) error {
	var expected installFile
	for _, file := range files {
		if file.label == "Nginx site" {
			expected = file
			break
		}
	}
	nginxRoot := filepath.Dir(options.nginxDir)
	if _, err := os.Stat(options.nginxDir); err != nil {
		return fmt.Errorf("Nginx 설정 디렉터리를 읽을 수 없습니다: %w", err)
	}
	return filepath.WalkDir(nginxRoot, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			return nil
		}
		contents, readErr := os.ReadFile(path)
		if readErr != nil {
			return readErr
		}
		if !nginxContainsDomain(string(contents), options.domain) {
			return nil
		}
		resolved, _ := filepath.EvalSymlinks(path)
		if (path == expected.path || resolved == expected.path) && string(contents) == string(expected.content) {
			return nil
		}
		return fmt.Errorf("기존 Nginx 설정이 도메인 %s을 사용합니다: %s", options.domain, path)
	})
}

func nginxContainsDomain(contents, domain string) bool {
	var uncommented strings.Builder
	for _, line := range strings.Split(contents, "\n") {
		uncommented.WriteString(strings.SplitN(line, "#", 2)[0])
		uncommented.WriteByte('\n')
	}
	for _, match := range serverNamePattern.FindAllStringSubmatch(uncommented.String(), -1) {
		for _, field := range strings.Fields(match[1]) {
			if nginxServerNameMatches(field, domain) {
				return true
			}
		}
	}
	return false
}

func nginxServerNameMatches(serverName, domain string) bool {
	serverName = strings.ToLower(serverName)
	domain = strings.ToLower(domain)
	if serverName == domain || serverName == "."+domain {
		return true
	}
	if strings.HasPrefix(serverName, "*.") {
		suffix := strings.TrimPrefix(serverName, "*")
		return strings.HasSuffix(domain, suffix) && domain != strings.TrimPrefix(suffix, ".")
	}
	return strings.HasPrefix(serverName, "~") && strings.Contains(strings.ReplaceAll(serverName, "\\", ""), domain)
}

func preflightInstallFiles(files []installFile) error {
	for _, file := range files {
		contents, err := os.ReadFile(file.path)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return err
		}
		if string(contents) != string(file.content) {
			return fmt.Errorf("기존 파일을 덮어쓰지 않습니다: %s", file.path)
		}
	}
	return nil
}

func printInstallPlan(options installOptions, files []installFile, environmentExists bool, nodeBinary string) {
	fmt.Printf("NUBO 설치 준비 계획 (%s)\n", options.domain)
	fmt.Printf("- 릴리스: %s\n", options.releaseDir)
	fmt.Printf("- Node.js: %s\n", nodeBinary)
	fmt.Printf("- 상태/업로드: %s / %s\n", options.stateDir, options.uploadDir)
	if _, err := user.LookupGroup(options.serviceGroup); err != nil {
		fmt.Printf("- 생성: 시스템 그룹 %s\n", options.serviceGroup)
	} else {
		fmt.Printf("- 유지: 서비스 그룹 %s\n", options.serviceGroup)
	}
	if _, err := user.Lookup(options.serviceUser); err != nil {
		fmt.Printf("- 생성: 시스템 사용자 %s\n", options.serviceUser)
	} else {
		fmt.Printf("- 유지: 서비스 사용자 %s\n", options.serviceUser)
	}
	if environmentExists {
		fmt.Printf("- 환경 파일 보존: %s\n", options.envFile)
	}
	for _, file := range files {
		if contents, err := os.ReadFile(file.path); err == nil && string(contents) == string(file.content) {
			fmt.Printf("- 유지: %s (%s)\n", file.path, file.label)
		} else {
			fmt.Printf("- 생성: %s (%s)\n", file.path, file.label)
		}
	}
	fmt.Println("- 제외: DB 준비, systemd 활성화/시작, Nginx enable/reload, TLS")
}

func ensureServiceIdentity(options installOptions, runner commandRunner) (int, int, error) {
	group, groupErr := user.LookupGroup(options.serviceGroup)
	if groupErr != nil {
		if !commandExists(runner, "groupadd") {
			return 0, 0, fmt.Errorf("그룹 %s이 없고 groupadd를 찾을 수 없습니다", options.serviceGroup)
		}
		if output, err := runner.run("groupadd", "--system", options.serviceGroup); err != nil {
			return 0, 0, fmt.Errorf("서비스 그룹 생성 실패: %s", compactOutput(output, err))
		}
		group, groupErr = user.LookupGroup(options.serviceGroup)
	}
	if groupErr != nil {
		return 0, 0, groupErr
	}
	account, accountErr := user.Lookup(options.serviceUser)
	if accountErr != nil {
		if !commandExists(runner, "useradd") {
			return 0, 0, fmt.Errorf("사용자 %s이 없고 useradd를 찾을 수 없습니다", options.serviceUser)
		}
		arguments := []string{"--system", "--gid", options.serviceGroup, "--home-dir", options.stateDir, "--shell", "/usr/sbin/nologin", options.serviceUser}
		if output, err := runner.run("useradd", arguments...); err != nil {
			return 0, 0, fmt.Errorf("서비스 사용자 생성 실패: %s", compactOutput(output, err))
		}
		account, accountErr = user.Lookup(options.serviceUser)
	}
	if accountErr != nil {
		return 0, 0, accountErr
	}
	uid, err := strconv.Atoi(account.Uid)
	if err != nil {
		return 0, 0, err
	}
	gid, err := strconv.Atoi(group.Gid)
	if err != nil {
		return 0, 0, err
	}
	return uid, gid, nil
}

func ensureInstallDirectory(path string, mode os.FileMode, uid, gid int) error {
	info, err := os.Stat(path)
	if err == nil {
		if !info.IsDir() {
			return fmt.Errorf("디렉터리 경로에 파일이 있습니다: %s", path)
		}
		return nil
	}
	if !os.IsNotExist(err) {
		return err
	}
	if err := os.MkdirAll(path, mode); err != nil {
		return err
	}
	if err := os.Chmod(path, mode); err != nil {
		return err
	}
	if os.Geteuid() == 0 {
		return os.Chown(path, uid, gid)
	}
	return nil
}

func installFileIfNeeded(file installFile) error {
	contents, err := os.ReadFile(file.path)
	if err == nil {
		if string(contents) == string(file.content) {
			return nil
		}
		return fmt.Errorf("기존 파일을 덮어쓰지 않습니다: %s", file.path)
	}
	if !os.IsNotExist(err) {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(file.path), 0o755); err != nil {
		return err
	}
	temporary, err := os.CreateTemp(filepath.Dir(file.path), ".nuboctl-*")
	if err != nil {
		return err
	}
	temporaryPath := temporary.Name()
	defer os.Remove(temporaryPath)
	if _, err := temporary.Write(file.content); err != nil {
		temporary.Close()
		return err
	}
	if err := temporary.Sync(); err != nil {
		temporary.Close()
		return err
	}
	if err := temporary.Chmod(file.mode); err != nil {
		temporary.Close()
		return err
	}
	if os.Geteuid() == 0 {
		if err := temporary.Chown(file.uid, file.gid); err != nil {
			temporary.Close()
			return err
		}
	}
	if err := temporary.Close(); err != nil {
		return err
	}
	if err := os.Link(temporaryPath, file.path); err != nil {
		if errors.Is(err, os.ErrExist) {
			return fmt.Errorf("설치 중 파일이 생성되어 덮어쓰지 않습니다: %s", file.path)
		}
		return err
	}
	return nil
}
