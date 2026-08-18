package main

import (
	"fmt"
	"net/mail"
	"os"
	"regexp"
	"strconv"
	"strings"
)

// 비대화형 입력 파일의 비밀값 보호 권한과 구문을 검사한다.
func readInstallEnvironmentInput(path string) (map[string]string, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("설치 입력 파일 확인 실패: %w", err)
	}
	if !info.Mode().IsRegular() {
		return nil, fmt.Errorf("설치 입력 경로가 일반 파일이 아닙니다: %s", path)
	}
	if info.Mode().Perm()&0o077 != 0 {
		return nil, fmt.Errorf("설치 입력 파일 권한은 0600 이하이어야 합니다: %#o", info.Mode().Perm())
	}
	values, err := readEnvironment(path)
	if err != nil {
		return nil, fmt.Errorf("설치 입력 파일 구문 오류: %w", err)
	}
	return values, nil
}

// 질문 없는 설치에 필요한 DB·관리자 값을 모두 요구한다.
func validateInstallEnvironmentInput(values map[string]string) error {
	required := []string{
		"DB_HOST", "DB_PORT", "DB_USER", "DB_PASS", "DB_NAME", "DB_TABLE_PREFIX",
		"ADMIN_ID", "ADMIN_PW", "GOAPI_TITLE", "NUXT_PUBLIC_TITLE", "NUXT_PUBLIC_ADMIN_ID",
	}
	missing := make([]string, 0)
	for _, key := range required {
		value := strings.TrimSpace(values[key])
		if value == "" || (strings.HasPrefix(value, "#") && strings.HasSuffix(value, "#")) {
			missing = append(missing, key)
		}
	}
	if len(missing) > 0 {
		return fmt.Errorf("설치 입력 파일에 필수값이 없습니다: %s", strings.Join(missing, ", "))
	}
	if len(values["ADMIN_PW"]) < 8 {
		return fmt.Errorf("ADMIN_PW는 8자 이상이어야 합니다")
	}
	if matched, _ := regexp.MatchString(`^[A-Za-z0-9_]+$`, values["DB_TABLE_PREFIX"]); !matched {
		return fmt.Errorf("DB_TABLE_PREFIX에는 영문, 숫자, 밑줄만 사용할 수 있습니다")
	}
	port, err := strconv.Atoi(values["DB_PORT"])
	if err != nil || port < 1 || port > 65535 {
		return fmt.Errorf("DB_PORT는 1~65535 숫자여야 합니다")
	}
	address, err := mail.ParseAddress(values["ADMIN_ID"])
	if err != nil || address.Address != values["ADMIN_ID"] {
		return fmt.Errorf("ADMIN_ID 이메일 형식이 올바르지 않습니다")
	}
	if values["NUXT_PUBLIC_ADMIN_ID"] != values["ADMIN_ID"] {
		return fmt.Errorf("NUXT_PUBLIC_ADMIN_ID는 ADMIN_ID와 같아야 합니다")
	}
	if values["NUXT_PUBLIC_TITLE"] != values["GOAPI_TITLE"] {
		return fmt.Errorf("NUXT_PUBLIC_TITLE은 GOAPI_TITLE과 같아야 합니다")
	}
	return nil
}
