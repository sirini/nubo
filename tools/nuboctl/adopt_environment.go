package main

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var environmentReference = regexp.MustCompile(`^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$`)

// 레거시 환경 파일의 단순 ${KEY} 참조를 풀어 현재 sample에 넣을 값으로 바꾼다.
func prepareAdoptedEnvironment(sourceDir string) (map[string]string, string, string, []string, error) {
	legacyPath := filepath.Join(sourceDir, ".env")
	values, err := readEnvironment(legacyPath)
	if err != nil {
		return nil, "", "", nil, fmt.Errorf("기존 환경 파일을 읽을 수 없습니다: %w", err)
	}
	for key := range values {
		resolved, resolveErr := resolveLegacyValue(key, values, map[string]bool{})
		if resolveErr != nil {
			return nil, "", "", nil, resolveErr
		}
		values[key] = resolved
	}
	domainValue := firstValue(values, "GOAPI_DOMAIN", "NUXT_PUBLIC_DOMAIN")
	parsed, err := url.Parse(domainValue)
	if err != nil || parsed.Hostname() == "" {
		return nil, "", "", nil, fmt.Errorf("기존 GOAPI_DOMAIN 또는 NUXT_PUBLIC_DOMAIN에서 도메인을 찾을 수 없습니다")
	}
	uploadDir := strings.TrimSpace(values["NUBO_UPLOAD_DIR"])
	if uploadDir == "" {
		uploadDir = filepath.Join(sourceDir, "upload")
	} else if !filepath.IsAbs(uploadDir) {
		uploadDir = filepath.Join(sourceDir, uploadDir)
	}
	uploadDir = filepath.Clean(uploadDir)
	values["GOAPI_HOST"] = "127.0.0.1"
	values["NITRO_HOST"] = "127.0.0.1"
	setDefault(values, "GOAPI_BASE", "goapi")
	setDefault(values, "GOAPI_PORT", "3006")
	setDefault(values, "NITRO_PORT", "3000")
	setDefault(values, "DB_PORT", "3306")
	setDefault(values, "DB_UNIX_SOCKET", "")
	setDefault(values, "DB_MAX_IDLE", "10")
	setDefault(values, "DB_MAX_OPEN", "100")
	values["NUBO_UPLOAD_DIR"] = uploadDir
	values["NUXT_API_BASE_INTERNAL"] = "http://127.0.0.1:" + values["GOAPI_PORT"] + "/" + strings.Trim(values["GOAPI_BASE"], "/")
	values["NUXT_PUBLIC_GOAPI_BASE"] = firstValue(values, "NUXT_PUBLIC_GOAPI_BASE", "NUXT_PUBLIC_GOAPI_PATH", "GOAPI_BASE")
	setFrom(values, "NUXT_PUBLIC_DOMAIN", "GOAPI_DOMAIN")
	setFrom(values, "NUXT_PUBLIC_TITLE", "GOAPI_TITLE")
	setFrom(values, "NUXT_PUBLIC_ADMIN_ID", "ADMIN_ID")
	warnings := legacyEnvironmentWarnings(values)
	delete(values, "GOAPI_VERSION")
	delete(values, "NUXT_PUBLIC_VERSION")
	return values, strings.ToLower(parsed.Hostname()), uploadDir, warnings, nil
}

func resolveLegacyValue(key string, values map[string]string, visiting map[string]bool) (string, error) {
	if visiting[key] {
		return "", fmt.Errorf("기존 환경 파일에 순환 참조가 있습니다: %s", key)
	}
	match := environmentReference.FindStringSubmatch(strings.TrimSpace(values[key]))
	if match == nil {
		return values[key], nil
	}
	if _, exists := values[match[1]]; !exists {
		return "", fmt.Errorf("기존 환경 파일의 %s가 없는 %s을 참조합니다", key, match[1])
	}
	visiting[key] = true
	defer delete(visiting, key)
	return resolveLegacyValue(match[1], values, visiting)
}

func firstValue(values map[string]string, keys ...string) string {
	for _, key := range keys {
		if value := strings.TrimSpace(values[key]); value != "" {
			return value
		}
	}
	return ""
}

func setDefault(values map[string]string, key, fallback string) {
	if strings.TrimSpace(values[key]) == "" {
		values[key] = fallback
	}
}

func setFrom(values map[string]string, target, source string) {
	if strings.TrimSpace(values[target]) == "" {
		values[target] = values[source]
	}
}

func legacyEnvironmentWarnings(values map[string]string) []string {
	keys := []string{"GMAIL_ID", "GMAIL_APP_PASSWORD", "GMAIL_USER", "GMAIL_PASS", "GOOGLE_EMAIL", "GOOGLE_PASSWORD"}
	warnings := make([]string, 0)
	for _, key := range keys {
		if strings.TrimSpace(values[key]) != "" {
			warnings = append(warnings, key)
		}
	}
	return warnings
}

// 환경 파일 원본을 삭제하지 않고 제한된 권한의 rollback 참고본으로 복사한다.
func backupLegacyEnvironment(sourceDir, stateDir string) error {
	contents, err := os.ReadFile(filepath.Join(sourceDir, ".env"))
	if err != nil {
		return err
	}
	destination := filepath.Join(stateDir, "adoption", "legacy.env")
	if err := os.MkdirAll(filepath.Dir(destination), 0o700); err != nil {
		return err
	}
	if _, err := os.Stat(destination); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return err
	}
	return os.WriteFile(destination, contents, 0o600)
}
