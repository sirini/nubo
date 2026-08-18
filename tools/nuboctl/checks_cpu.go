package main

import (
	"fmt"
	"os"
	"strings"
)

// CPU 정보에서 sharp-libvips 실행에 필요한 명령어 집합을 확인한다.
func checkCPUFeature(path, feature string) checkResult {
	if err := requireCPUFeature(path, feature); err != nil {
		return fail("CPU", err.Error())
	}
	return pass("CPU", strings.ToUpper(strings.ReplaceAll(feature, "_", "."))+" 지원")
}

// 지정한 CPU 기능이 없으면 설치를 중단할 수 있는 오류를 반환한다.
func requireCPUFeature(path, feature string) error {
	contents, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("CPU 기능을 확인할 수 없습니다: %w", err)
	}
	if !containsCPUFeature(string(contents), feature) {
		return fmt.Errorf("내장 libvips 실행에 필요한 %s를 지원하지 않습니다", strings.ToUpper(strings.ReplaceAll(feature, "_", ".")))
	}
	return nil
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
