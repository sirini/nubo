package main

import (
	"bufio"
	"fmt"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func readEnvironment(path string) (map[string]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	values := make(map[string]string)
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, found := strings.Cut(line, "=")
		if !found {
			return nil, fmt.Errorf("잘못된 환경 설정 줄: %q", line)
		}
		key = strings.TrimSpace(key)
		if key == "" {
			return nil, fmt.Errorf("환경 변수 이름이 비어 있습니다")
		}
		value = strings.TrimSpace(value)
		if len(value) >= 2 && ((value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'')) {
			value = value[1 : len(value)-1]
		}
		values[key] = value
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return values, nil
}

func checkEnvironment(options options, required bool) ([]checkResult, map[string]string) {
	info, err := os.Stat(options.envFile)
	if err != nil {
		if os.IsNotExist(err) {
			if required {
				return []checkResult{fail("환경 파일", options.envFile+" 파일이 없습니다")}, nil
			}
			return []checkResult{warn("환경 파일", options.envFile+" 파일이 아직 없습니다")}, nil
		}
		return []checkResult{fail("환경 파일", err.Error())}, nil
	}

	results := []checkResult{pass("환경 파일", options.envFile)}
	mode := info.Mode().Perm()
	if mode&0o007 != 0 || mode&0o020 != 0 {
		results = append(results, fail("환경 파일 권한", fmt.Sprintf("%#o: 다른 사용자 접근 또는 그룹 쓰기를 제거하세요", mode)))
	} else {
		results = append(results, pass("환경 파일 권한", fmt.Sprintf("%#o", mode)))
	}

	values, err := readEnvironment(options.envFile)
	if err != nil {
		return append(results, fail("환경 파일 구문", err.Error())), nil
	}
	requiredKeys := []string{
		"GOAPI_PORT", "GOAPI_DOMAIN", "DB_HOST", "DB_USER", "DB_PASS", "DB_NAME",
		"JWT_SECRET_KEY", "SYNC_SECRET_KEY", "NITRO_PORT", "NUXT_API_BASE_INTERNAL",
	}
	missing := make([]string, 0)
	for _, key := range requiredKeys {
		value := strings.TrimSpace(values[key])
		if value == "" || (strings.HasPrefix(value, "#") && strings.HasSuffix(value, "#")) {
			missing = append(missing, key)
		}
	}
	if len(missing) > 0 {
		results = append(results, fail("필수 환경 설정", "누락 또는 미설정: "+strings.Join(missing, ", ")))
	} else {
		results = append(results, pass("필수 환경 설정", "필수 값이 모두 설정되었습니다"))
	}

	for _, key := range []string{"GOAPI_HOST", "NITRO_HOST"} {
		host := strings.TrimSpace(values[key])
		if host == "" {
			results = append(results, warn(key, "명시되지 않아 기존 런타임 기본값을 사용합니다"))
		} else if isLoopbackHost(host) {
			results = append(results, pass(key, host))
		} else {
			results = append(results, warn(key, host+"에서 수신하므로 애플리케이션 포트가 외부에 노출되지 않았는지 확인하세요"))
		}
	}

	return results, values
}

func isLoopbackHost(host string) bool {
	if strings.EqualFold(host, "localhost") {
		return true
	}
	ip := net.ParseIP(strings.Trim(host, "[]"))
	return ip != nil && ip.IsLoopback()
}

func uploadDirectory(options options, values map[string]string) string {
	configured := strings.TrimSpace(values["NUBO_UPLOAD_DIR"])
	if configured == "" {
		configured = "./upload"
	}
	if filepath.IsAbs(configured) {
		return filepath.Clean(configured)
	}
	return filepath.Join(options.stateDir, configured)
}

func webBaseURL(options options, values map[string]string) string {
	if options.webURL != "" {
		return strings.TrimRight(options.webURL, "/")
	}
	host := strings.TrimSpace(values["NITRO_HOST"])
	if host == "" || host == "0.0.0.0" || host == "::" {
		host = "127.0.0.1"
	}
	port := strings.TrimSpace(values["NITRO_PORT"])
	if _, err := strconv.Atoi(port); err != nil {
		port = "3000"
	}
	return (&url.URL{Scheme: "http", Host: net.JoinHostPort(host, port)}).String()
}
