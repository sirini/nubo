package main

import "fmt"

type resultLevel uint8

const (
	levelPass resultLevel = iota
	levelWarn
	levelFail
)

type checkResult struct {
	name   string
	level  resultLevel
	detail string
}

// pass는 통과한 진단 결과를 만든다.
func pass(name, detail string) checkResult {
	return checkResult{name: name, level: levelPass, detail: detail}
}

// warn은 설치를 막지 않지만 사용자가 확인할 진단 결과를 만든다.
func warn(name, detail string) checkResult {
	return checkResult{name: name, level: levelWarn, detail: detail}
}

// fail은 명령을 실패로 끝내야 하는 진단 결과를 만든다.
func fail(name, detail string) checkResult {
	return checkResult{name: name, level: levelFail, detail: detail}
}

// printReport는 진단 결과와 요약을 출력하고 실패 여부를 종료 코드로 반환한다.
func printReport(results []checkResult) int {
	failures := 0
	warnings := 0
	for _, result := range results {
		label := "PASS"
		switch result.level {
		case levelWarn:
			label = "WARN"
			warnings++
		case levelFail:
			label = "FAIL"
			failures++
		}
		fmt.Printf("[%s] %s: %s\n", label, result.name, result.detail)
	}
	fmt.Printf("\n결과: 실패 %d, 경고 %d, 통과 %d\n", failures, warnings, len(results)-failures-warnings)
	if failures > 0 {
		return 1
	}
	return 0
}
