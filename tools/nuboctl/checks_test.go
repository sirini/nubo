package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

// Node 22 이상을 허용하고 그 아래 버전만 거부하는지 확인한다.
func TestCheckNodeEnforcesMinimumVersion(t *testing.T) {
	runner := fakeRunner{
		paths:   map[string]bool{"node": true},
		outputs: map[string]string{"node --version": "v22.0.0\n"},
		errors:  map[string]error{},
	}
	if result := checkNode(runner); result.level != levelPass {
		t.Fatalf("supported Node result = %+v", result)
	}

	runner.outputs["node --version"] = "v30.0.0\n"
	if result := checkNode(runner); result.level != levelPass {
		t.Fatalf("newer Node result = %+v", result)
	}

	runner.outputs["node --version"] = "v21.99.0\n"
	if result := checkNode(runner); result.level != levelFail {
		t.Fatalf("old Node result = %+v", result)
	}
}

// SSE4.2가 없는 CPU를 실패시키지 않고 호환판 사용으로 안내한다.
func TestCheckImageCPUAllowsBaselineCPU(t *testing.T) {
	path := t.TempDir() + "/cpuinfo"
	if err := os.WriteFile(path, []byte("flags : fpu sse sse2 pni\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	result := checkImageCPU(path)
	if result.level != levelPass || !strings.Contains(result.detail, "호환판") {
		t.Fatalf("baseline CPU result = %+v", result)
	}
}

// 200 JSON이어도 정상 상태가 아니면 실패하는지 확인한다.
func TestCheckHTTPRequiresHealthyJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("content-type", "application/json")
		if request.URL.Path == "/ready" {
			response.WriteHeader(http.StatusServiceUnavailable)
			_, _ = response.Write([]byte(`{"status":"unavailable"}`))
			return
		}
		_, _ = response.Write([]byte(`{"status":"ok"}`))
	}))
	defer server.Close()

	if result := checkHTTP(server.URL + "/health"); result.level != levelPass {
		t.Fatalf("health result = %+v", result)
	}
	if result := checkHTTP(server.URL + "/ready"); result.level != levelFail {
		t.Fatalf("readiness result = %+v", result)
	}
}

func TestRunningServiceUserPrefersSystemdValue(t *testing.T) {
	runner := fakeRunner{
		paths: map[string]bool{"systemctl": true},
		outputs: map[string]string{
			"systemctl show --property=User --value nubo-goapi.service": "actual-owner\n",
		},
		errors: map[string]error{},
	}
	if user := runningServiceUser("configured-owner", runner); user != "actual-owner" {
		t.Fatalf("실행 서비스 사용자 = %q", user)
	}
	runner.outputs["systemctl show --property=User --value nubo-goapi.service"] = "invalid user\n"
	if user := runningServiceUser("configured-owner", runner); user != "configured-owner" {
		t.Fatalf("fallback 서비스 사용자 = %q", user)
	}
}
