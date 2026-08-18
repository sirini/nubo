package main

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

type scriptedPrompter struct {
	answers map[string]string
	secrets []string
	index   int
	agreed  bool
}

// ask는 질문 이름에 대응하는 준비된 일반 입력을 반환한다.
func (prompt *scriptedPrompter) ask(label, defaultValue string) (string, error) {
	if value, ok := prompt.answers[label]; ok {
		return value, nil
	}
	return defaultValue, nil
}

// askSecret은 준비된 비밀값을 입력 순서대로 반환한다.
func (prompt *scriptedPrompter) askSecret(_ string) (string, error) {
	if prompt.index >= len(prompt.secrets) {
		return "", errors.New("준비된 비밀값이 없습니다")
	}
	value := prompt.secrets[prompt.index]
	prompt.index++
	return value, nil
}

// confirm은 테스트가 지정한 최종 설치 동의 여부를 반환한다.
func (prompt *scriptedPrompter) confirm(_ string) (bool, error) {
	return prompt.agreed, nil
}

// TestPromptInstallOptionsCollectsRuntimeValues는 대화형 입력이 공용 환경 설정으로 정확히 연결되는지 확인한다.
func TestPromptInstallOptionsCollectsRuntimeValues(t *testing.T) {
	options := installTestOptions(t)
	options.domain = ""
	prompt := &scriptedPrompter{
		answers: map[string]string{
			"서비스 도메인 (https:// 제외)": "community.example.com",
			"커뮤니티 이름":               "테스트 커뮤니티",
			"최초 관리자 이메일":            "admin@example.com",
		},
		secrets: []string{"database-secret", "admin-password", "admin-password"},
		agreed:  true,
	}

	result, err := promptInstallOptions(options, prompt)
	if err != nil {
		t.Fatal(err)
	}
	if result.environmentValues["GOAPI_TITLE"] != "테스트 커뮤니티" {
		t.Fatalf("GOAPI_TITLE = %q", result.environmentValues["GOAPI_TITLE"])
	}
	if result.environmentValues["DB_PASS"] != "database-secret" {
		t.Fatal("DB 비밀번호가 대화형 입력에서 환경 설정으로 전달되지 않았습니다")
	}
	if result.environmentValues["NUXT_PUBLIC_DOMAIN"] != "https://community.example.com" {
		t.Fatalf("NUXT_PUBLIC_DOMAIN = %q", result.environmentValues["NUXT_PUBLIC_DOMAIN"])
	}
	confirmed, err := result.confirm()
	if err != nil || !confirmed {
		t.Fatalf("설치 확인 = %v, %v", confirmed, err)
	}
}

// TestReadInstallEnvironmentInputRequiresPrivateMode는 비밀 입력 파일의 타인 접근 권한을 거부한다.
func TestReadInstallEnvironmentInputRequiresPrivateMode(t *testing.T) {
	path := filepath.Join(t.TempDir(), "install.env")
	if err := os.WriteFile(path, []byte("DB_PASS=secret\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := readInstallEnvironmentInput(path); err == nil {
		t.Fatal("공개된 설치 입력 파일 권한을 허용했습니다")
	}
}

// TestValidateInstallEnvironmentInputReportsMissingKeys는 비대화형 필수값을 한 번에 안내하는지 확인한다.
func TestValidateInstallEnvironmentInputReportsMissingKeys(t *testing.T) {
	if err := validateInstallEnvironmentInput(map[string]string{"DB_HOST": "127.0.0.1"}); err == nil {
		t.Fatal("필수값이 빠진 비대화형 설치 입력을 허용했습니다")
	}
}

// TestValidateInstallEnvironmentInputChecksRelatedValues는 자동 설치 값 사이의 정합성을 검사한다.
func TestValidateInstallEnvironmentInputChecksRelatedValues(t *testing.T) {
	valid := map[string]string{
		"DB_HOST": "127.0.0.1", "DB_PORT": "3306", "DB_USER": "nubo", "DB_PASS": "database-secret",
		"DB_NAME": "nubo", "DB_TABLE_PREFIX": "nubo_", "ADMIN_ID": "admin@example.com", "ADMIN_PW": "admin-password",
		"GOAPI_TITLE": "내 커뮤니티", "NUXT_PUBLIC_TITLE": "내 커뮤니티", "NUXT_PUBLIC_ADMIN_ID": "admin@example.com",
	}
	if err := validateInstallEnvironmentInput(valid); err != nil {
		t.Fatalf("유효한 설치 입력 거부: %v", err)
	}

	for name, change := range map[string]func(map[string]string){
		"DB 포트":   func(values map[string]string) { values["DB_PORT"] = "70000" },
		"관리자 이메일": func(values map[string]string) { values["ADMIN_ID"] = "admin" },
		"공개 관리자":  func(values map[string]string) { values["NUXT_PUBLIC_ADMIN_ID"] = "other@example.com" },
		"사이트 이름":  func(values map[string]string) { values["NUXT_PUBLIC_TITLE"] = "다른 이름" },
	} {
		t.Run(name, func(t *testing.T) {
			values := make(map[string]string, len(valid))
			for key, value := range valid {
				values[key] = value
			}
			change(values)
			if err := validateInstallEnvironmentInput(values); err == nil {
				t.Fatal("서로 맞지 않는 설치 입력을 허용했습니다")
			}
		})
	}
}
