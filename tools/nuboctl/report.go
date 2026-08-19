package main

import (
	"fmt"
	"os"
)

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

// 통과한 진단 결과를 만든다.
func pass(name, detail string) checkResult {
	return checkResult{name: name, level: levelPass, detail: detail}
}

// 설치를 막지 않지만 사용자가 확인할 진단 결과를 만든다.
func warn(name, detail string) checkResult {
	return checkResult{name: name, level: levelWarn, detail: detail}
}

// 명령을 실패로 끝내야 하는 진단 결과를 만든다.
func fail(name, detail string) checkResult {
	return checkResult{name: name, level: levelFail, detail: detail}
}

// 진단 결과와 요약을 출력하고 실패 여부를 종료 코드로 반환한다.
func printReport(results []checkResult) int {
	failures := 0
	warnings := 0
	printHeading("점검 결과")
	for _, result := range results {
		label := paint(os.Stdout, ansiGreen, "✓ 통과")
		switch result.level {
		case levelWarn:
			label = paint(os.Stdout, ansiYellow, "! 확인")
			warnings++
		case levelFail:
			label = paint(os.Stdout, ansiRed, "✗ 실패")
			failures++
		}
		fmt.Printf("  %s  %s\n          %s\n", label, result.name, result.detail)
	}
	fmt.Printf("\n%s\n", paint(os.Stdout, ansiBold, fmt.Sprintf("요약  통과 %d · 확인 %d · 실패 %d", len(results)-failures-warnings, warnings, failures)))
	if failures > 0 {
		return 1
	}
	return 0
}
