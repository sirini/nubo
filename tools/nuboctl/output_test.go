package main

import (
	"bytes"
	"strings"
	"testing"
)

func TestPaintKeepsCapturedOutputPlain(t *testing.T) {
	var output bytes.Buffer
	value := paint(&output, ansiRed, "실패")
	if value != "실패" || strings.Contains(value, "\x1b[") {
		t.Fatalf("파이프 출력에 ANSI 색상이 포함됐습니다: %q", value)
	}
}
