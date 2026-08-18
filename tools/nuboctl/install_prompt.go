package main

import (
	"bufio"
	"fmt"
	"io"
	"net/mail"
	"net/url"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

type installPrompter interface {
	ask(label, defaultValue string) (string, error)
	askSecret(label string) (string, error)
	confirm(label string) (bool, error)
}

type terminalPrompter struct {
	input  *os.File
	output io.Writer
	reader *bufio.Reader
}

// newTerminalPrompter는 한 터미널에서 일반값과 숨김 비밀번호를 읽는 설치 입력기를 만든다.
func newTerminalPrompter(input *os.File, output io.Writer) terminalPrompter {
	return terminalPrompter{input: input, output: output, reader: bufio.NewReader(input)}
}

// ask는 기본값을 함께 보여주고 한 줄의 사용자 입력을 읽는다.
func (prompt terminalPrompter) ask(label, defaultValue string) (string, error) {
	if defaultValue == "" {
		fmt.Fprintf(prompt.output, "%s: ", label)
	} else {
		fmt.Fprintf(prompt.output, "%s [%s]: ", label, defaultValue)
	}
	value, err := prompt.reader.ReadString('\n')
	if err != nil && err != io.EOF {
		return "", err
	}
	value = strings.TrimSpace(value)
	if value == "" {
		return defaultValue, nil
	}
	return value, nil
}

// askSecret은 stty로 터미널 표시를 잠시 끄고 비밀번호 한 줄을 읽는다.
func (prompt terminalPrompter) askSecret(label string) (string, error) {
	info, err := prompt.input.Stat()
	if err != nil || info.Mode()&os.ModeCharDevice == 0 {
		return "", fmt.Errorf("비밀번호는 터미널에서 직접 입력해야 합니다; 자동화는 --non-interactive와 --env-input을 사용하세요")
	}
	fmt.Fprintf(prompt.output, "%s: ", label)
	disable := exec.Command("stty", "-echo")
	disable.Stdin = prompt.input
	if err := disable.Run(); err != nil {
		return "", fmt.Errorf("비밀번호 숨김 입력을 시작할 수 없습니다: %w", err)
	}
	defer func() {
		enable := exec.Command("stty", "echo")
		enable.Stdin = prompt.input
		_ = enable.Run()
		fmt.Fprintln(prompt.output)
	}()
	value, err := prompt.reader.ReadString('\n')
	return strings.TrimSpace(value), err
}

// confirm은 한국어 예·아니요 입력을 읽고 빈 입력은 동의로 처리한다.
func (prompt terminalPrompter) confirm(label string) (bool, error) {
	value, err := prompt.ask(label+" [Y/n]", "")
	if err != nil {
		return false, err
	}
	if value == "" {
		return true, nil
	}
	switch strings.ToLower(value) {
	case "y", "yes", "예", "네":
		return true, nil
	case "n", "no", "아니요", "아니오":
		return false, nil
	default:
		return false, fmt.Errorf("Y 또는 n으로 입력하세요")
	}
}

// promptInstallOptions는 사람에게 꼭 필요한 사이트·DB·관리자 정보만 한국어로 묻는다.
func promptInstallOptions(options installOptions, prompt installPrompter) (installOptions, error) {
	if domain, ok := existingInstallDomain(options.envFile); ok {
		options.domain = domain
		options.confirm = func() (bool, error) {
			return prompt.confirm("위 계획대로 기존 설치 준비를 확인할까요?")
		}
		return options, nil
	}

	domain, err := prompt.ask("서비스 도메인 (https:// 제외)", options.domain)
	if err != nil {
		return options, err
	}
	options.domain = strings.ToLower(domain)
	if err := validateDomain(options.domain); err != nil {
		return options, err
	}
	title, err := prompt.ask("커뮤니티 이름", "NUBO")
	if err != nil {
		return options, err
	}
	dbHost, err := prompt.ask("데이터베이스 주소", "127.0.0.1")
	if err != nil {
		return options, err
	}
	dbPort, err := prompt.ask("데이터베이스 포트", "3306")
	if err != nil {
		return options, err
	}
	if port, parseErr := strconv.Atoi(dbPort); parseErr != nil || port < 1 || port > 65535 {
		return options, fmt.Errorf("데이터베이스 포트는 1~65535 숫자여야 합니다")
	}
	dbName, err := prompt.ask("데이터베이스 이름", "nubo")
	if err != nil {
		return options, err
	}
	dbUser, err := prompt.ask("데이터베이스 사용자", "nubo")
	if err != nil {
		return options, err
	}
	dbPass, err := prompt.askSecret("데이터베이스 비밀번호")
	if err != nil || dbPass == "" {
		return options, firstError(err, "데이터베이스 비밀번호를 입력하세요")
	}
	dbPrefix, err := prompt.ask("테이블 이름 접두사", "nubo_")
	if err != nil {
		return options, err
	}
	adminID, err := prompt.ask("최초 관리자 이메일", "")
	if err != nil {
		return options, err
	}
	address, err := mail.ParseAddress(adminID)
	if err != nil || address.Address != adminID {
		return options, fmt.Errorf("최초 관리자 이메일 형식이 올바르지 않습니다")
	}
	adminPassword, err := prompt.askSecret("최초 관리자 비밀번호 (8자 이상)")
	if err != nil || len(adminPassword) < 8 {
		return options, firstError(err, "최초 관리자 비밀번호는 8자 이상이어야 합니다")
	}
	adminPasswordAgain, err := prompt.askSecret("최초 관리자 비밀번호 확인")
	if err != nil || adminPasswordAgain != adminPassword {
		return options, firstError(err, "관리자 비밀번호 확인이 일치하지 않습니다")
	}

	publicURL := "https://" + options.domain
	options.environmentValues = map[string]string{
		"GOAPI_DOMAIN":         publicURL,
		"GOAPI_TITLE":          title,
		"NUXT_PUBLIC_DOMAIN":   publicURL,
		"NUXT_PUBLIC_TITLE":    title,
		"DB_HOST":              dbHost,
		"DB_PORT":              dbPort,
		"DB_USER":              dbUser,
		"DB_PASS":              dbPass,
		"DB_NAME":              dbName,
		"DB_TABLE_PREFIX":      dbPrefix,
		"DB_UNIX_SOCKET":       "",
		"DB_MAX_IDLE":          "10",
		"DB_MAX_OPEN":          "10",
		"ADMIN_ID":             adminID,
		"ADMIN_PW":             adminPassword,
		"NUXT_PUBLIC_ADMIN_ID": adminID,
	}
	options.confirm = func() (bool, error) { return prompt.confirm("위 계획대로 설치 준비를 진행할까요?") }
	return options, nil
}

// existingInstallDomain은 기존 환경 파일에서 재실행에 사용할 공개 도메인을 찾는다.
func existingInstallDomain(path string) (string, bool) {
	values, err := readEnvironment(path)
	if err != nil {
		return "", false
	}
	for _, key := range []string{"NUXT_PUBLIC_DOMAIN", "GOAPI_DOMAIN"} {
		parsed, err := url.Parse(values[key])
		if err == nil && parsed.Hostname() != "" {
			return strings.ToLower(parsed.Hostname()), true
		}
	}
	return "", false
}

// firstError는 입력 오류가 있으면 보존하고 없으면 이해하기 쉬운 검증 오류를 만든다.
func firstError(err error, message string) error {
	if err != nil {
		return err
	}
	return fmt.Errorf("%s", message)
}
