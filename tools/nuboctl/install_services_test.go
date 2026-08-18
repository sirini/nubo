package main

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// HTTP 200과 ready JSON을 모두 만족할 때 준비 완료로 판정한다.
func TestWaitForInstallReadinessAcceptsReadyResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
		response.Header().Set("Content-Type", "application/json")
		_, _ = response.Write([]byte(`{"status":"ready"}`))
	}))
	defer server.Close()
	if err := waitForInstallReadiness(server.URL); err != nil {
		t.Fatal(err)
	}
}

// systemd 반영과 서비스 활성화 뒤 로컬 readiness를 확인한다.
func TestActivateNuboServicesStartsTargetAndChecksReadiness(t *testing.T) {
	options := installTestOptions(t)
	calls := make([]string, 0, 2)
	checkedEndpoint := ""
	runner := fakeRunner{
		paths:   map[string]bool{"systemctl": true},
		outputs: map[string]string{},
		errors:  map[string]error{},
		calls:   &calls,
	}
	err := activateNuboServices(options, runner, func(endpoint string) error {
		checkedEndpoint = endpoint
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if strings.Join(calls, "\n") != "systemctl daemon-reload\nsystemctl enable --now nubo.target" {
		t.Fatalf("systemd 명령 순서가 올바르지 않습니다: %v", calls)
	}
	if checkedEndpoint != "http://127.0.0.1:3000/ready" {
		t.Fatalf("readiness endpoint = %s", checkedEndpoint)
	}
}

// readiness 실패를 서비스 상태 확인 방법과 함께 반환한다.
func TestActivateNuboServicesReturnsReadinessFailure(t *testing.T) {
	options := installTestOptions(t)
	runner := fakeRunner{
		paths:   map[string]bool{"systemctl": true},
		outputs: map[string]string{},
		errors:  map[string]error{},
	}
	err := activateNuboServices(options, runner, func(string) error {
		return errors.New("connection refused")
	})
	if err == nil || !strings.Contains(err.Error(), "systemctl status") {
		t.Fatalf("readiness 실패 안내 = %v", err)
	}
}
