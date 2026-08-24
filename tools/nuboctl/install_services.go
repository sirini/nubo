package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const installReadinessAttempts = 30

// 홈 아래 Node.js만 읽기 가능하게 노출하고 시스템 경로에서는 홈을 완전히 숨긴다.
func protectHomeForNode(nodeBinary string) string {
	clean := filepath.Clean(nodeBinary)
	if strings.HasPrefix(clean, "/root/") || strings.HasPrefix(clean, "/home/") || nodeNeedsStaging(nodeBinary) {
		return "read-only"
	}
	return "true"
}

// systemd 설정을 다시 읽고 NUBO 서비스를 부팅 시 자동 시작하도록 활성화한다.
func activateNuboServices(options installOptions, runner commandRunner, readiness func(string) error) error {
	if !commandExists(runner, "systemctl") {
		return fmt.Errorf("서비스를 시작하려면 systemctl 명령이 필요합니다")
	}
	if output, err := runner.run("systemctl", "daemon-reload"); err != nil {
		return fmt.Errorf("systemd 설정 반영 실패: %s", compactOutput(output, err))
	}
	if output, err := runner.run("systemctl", "enable", "--now", "nubo.service"); err != nil {
		return fmt.Errorf("NUBO 서비스 시작 실패: %s", compactOutput(output, err))
	}
	// 이미 active인 대표 oneshot unit은 --now만으로 하위 프로세스를 새 설정으로
	// 다시 띄우지 않으므로 두 애플리케이션 서비스를 항상 명시적으로 재시작한다.
	if err := restartNuboServices(runner); err != nil {
		return err
	}
	for _, service := range []string{"nubo-goapi.service", "nubo-web.service"} {
		if output, err := runner.run("systemctl", "is-active", "--quiet", service); err != nil {
			return fmt.Errorf("%s가 실행되지 않았습니다: %s", service, compactOutput(output, err))
		}
	}
	endpoint := "http://127.0.0.1:" + strconv.Itoa(options.webPort) + "/ready"
	if err := readiness(endpoint); err != nil {
		return fmt.Errorf("NUBO readiness 확인 실패: %w; systemctl status nubo-goapi.service nubo-web.service로 로그를 확인하세요", err)
	}
	return nil
}

// 두 서비스가 연결된 readiness 응답을 돌려줄 때까지 제한 시간 동안 기다린다.
func waitForInstallReadiness(endpoint string) error {
	client := http.Client{Timeout: 2 * time.Second}
	var lastError error
	for attempt := 0; attempt < installReadinessAttempts; attempt++ {
		if attempt > 0 {
			time.Sleep(time.Second)
		}
		response, err := client.Get(endpoint)
		if err != nil {
			lastError = err
			continue
		}
		var payload struct {
			Status string `json:"status"`
		}
		decodeErr := json.NewDecoder(response.Body).Decode(&payload)
		_ = response.Body.Close()
		if response.StatusCode == http.StatusOK && decodeErr == nil &&
			(payload.Status == "ok" || payload.Status == "ready") {
			return nil
		}
		detail := strings.TrimSpace(response.Status)
		if decodeErr != nil {
			detail += ", JSON 응답 오류"
		} else {
			detail += fmt.Sprintf(", status=%q", payload.Status)
		}
		lastError = fmt.Errorf("%s (%s)", endpoint, detail)
	}
	if lastError == nil {
		lastError = fmt.Errorf("%s가 준비되지 않았습니다", endpoint)
	}
	return lastError
}
