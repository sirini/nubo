package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const installReadinessAttempts = 30

// systemd 설정을 다시 읽고 NUBO 서비스를 부팅 시 자동 시작하도록 활성화한다.
func activateNuboServices(options installOptions, runner commandRunner, readiness func(string) error) error {
	if !commandExists(runner, "systemctl") {
		return fmt.Errorf("서비스를 시작하려면 systemctl 명령이 필요합니다")
	}
	if output, err := runner.run("systemctl", "daemon-reload"); err != nil {
		return fmt.Errorf("systemd 설정 반영 실패: %s", compactOutput(output, err))
	}
	if output, err := runner.run("systemctl", "enable", "--now", "nubo.target"); err != nil {
		return fmt.Errorf("NUBO 서비스 시작 실패: %s", compactOutput(output, err))
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
		if response.StatusCode == http.StatusOK && decodeErr == nil && payload.Status == "ready" {
			return nil
		}
		detail := strings.TrimSpace(response.Status)
		if decodeErr != nil {
			detail += ", JSON 응답 오류"
		}
		lastError = fmt.Errorf("%s (%s)", endpoint, detail)
	}
	if lastError == nil {
		lastError = fmt.Errorf("%s가 준비되지 않았습니다", endpoint)
	}
	return lastError
}
