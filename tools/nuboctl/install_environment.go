package main

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// prepareInstallEnvironment는 기존 설정을 보존하거나 sample에서 새 설정과 비밀값을 만든다.
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
		"GOAPI_DOMAIN":           "https://" + options.domain,
		"NUBO_UPLOAD_DIR":        options.uploadDir,
		"JWT_SECRET_KEY":         jwtSecret,
		"SYNC_SECRET_KEY":        syncSecret,
		"NITRO_HOST":             "127.0.0.1",
		"NITRO_PORT":             strconv.Itoa(options.webPort),
		"NUXT_API_BASE_INTERNAL": "http://127.0.0.1:" + strconv.Itoa(options.goapiPort) + "/" + options.goapiPath,
		"NUXT_PUBLIC_GOAPI_BASE": options.goapiPath,
		"NUXT_PUBLIC_DOMAIN":     "https://" + options.domain,
	}
	for key, value := range options.environmentValues {
		replacements[key] = value
	}
	if options.envInput != "" {
		inputValues, err := readInstallEnvironmentInput(options.envInput)
		if err != nil {
			return nil, nil, false, err
		}
		for key, value := range inputValues {
			replacements[key] = value
		}
		if err := validateInstallEnvironmentInput(replacements); err != nil {
			return nil, nil, false, err
		}
	}
	content, err := renderEnvironmentSample(filepath.Join(options.releaseDir, "share/env.sample"), replacements)
	return replacements, content, false, err
}

// randomSecret은 설정 파일에 바로 저장할 256비트 임의 비밀값을 만든다.
func randomSecret() (string, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", fmt.Errorf("비밀값 생성 실패: %w", err)
	}
	return hex.EncodeToString(value), nil
}

// renderEnvironmentSample은 sample의 순서와 설명을 유지하며 지정된 설정만 교체한다.
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

// applyEnvironmentToInstallOptions는 기존 설정의 포트와 경로를 렌더링 기준으로 재사용한다.
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
