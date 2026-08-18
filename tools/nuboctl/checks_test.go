package main

import (
	"net/http"
	"net/http/httptest"
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

// CPU 기능 이름을 부분 문자열이 아닌 독립 토큰으로 판별하는지 확인한다.
func TestContainsCPUFeature(t *testing.T) {
	contents := "flags : fpu sse4_1 sse4_2 avx\n"
	if !containsCPUFeature(contents, "sse4_2") {
		t.Fatal("sse4_2 기능을 찾지 못했습니다")
	}
	if containsCPUFeature(contents, "sse4") {
		t.Fatal("부분 문자열을 CPU 기능으로 잘못 판별했습니다")
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
