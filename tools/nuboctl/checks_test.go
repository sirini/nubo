package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

// 지원 Node 범위의 경계 아래 버전을 거부하는지 확인한다.
func TestCheckNodeEnforcesSupportedRange(t *testing.T) {
	runner := fakeRunner{
		paths:   map[string]bool{"node": true},
		outputs: map[string]string{"node --version": "v26.7.0\n"},
		errors:  map[string]error{},
	}
	if result := checkNode(runner); result.level != levelPass {
		t.Fatalf("supported Node result = %+v", result)
	}

	runner.outputs["node --version"] = "v24.10.0\n"
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
