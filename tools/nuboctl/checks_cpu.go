package main

import (
	"os"
	"strings"
)

// CPU 정보로 이미지 라이브러리의 예상 자동 선택 결과를 안내한다.
func checkImageCPU(path string) checkResult {
	contents, err := os.ReadFile(path)
	if err != nil {
		return warn("이미지 CPU", "CPU 정보 확인 실패 · glibc가 내장판을 자동 선택합니다")
	}
	if !containsCPUFeature(string(contents), "sse4_2") {
		return pass("이미지 CPU", "SSE4.2 없음 · x86-64 호환판 자동 선택")
	}
	return pass("이미지 CPU", "glibc가 호환판 또는 x86-64-v2 최적화판 자동 선택")
}

// cpuinfo의 공백 구분 토큰에서 기능 이름이 정확히 일치하는지 찾는다.
func containsCPUFeature(contents, feature string) bool {
	for _, field := range strings.Fields(contents) {
		if field == feature {
			return true
		}
	}
	return false
}
