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

func pass(name, detail string) checkResult {
	return checkResult{name: name, level: levelPass, detail: detail}
}

func warn(name, detail string) checkResult {
	return checkResult{name: name, level: levelWarn, detail: detail}
}

func fail(name, detail string) checkResult {
	return checkResult{name: name, level: levelFail, detail: detail}
}

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
