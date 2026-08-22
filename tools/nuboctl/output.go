package main

import (
	"fmt"
	"io"
	"os"
)

const (
	ansiReset     = "\x1b[0m"
	ansiBold      = "\x1b[1m"
	ansiDim       = "\x1b[2m"
	ansiCyan      = "\x1b[36m"
	ansiGreen     = "\x1b[32m"
	ansiYellow    = "\x1b[33m"
	ansiRed       = "\x1b[31m"
	ansiBoldCyan  = ansiBold + ansiCyan
	ansiBoldGreen = ansiBold + ansiGreen
	ansiBoldRed   = ansiBold + ansiRed
)

func supportsColor(writer io.Writer) bool {
	if os.Getenv("NO_COLOR") != "" || os.Getenv("TERM") == "dumb" {
		return false
	}
	file, ok := writer.(*os.File)
	if !ok {
		return false
	}
	info, err := file.Stat()
	return err == nil && info.Mode()&os.ModeCharDevice != 0
}

func paint(writer io.Writer, code, value string) string {
	if !supportsColor(writer) {
		return value
	}
	return code + value + ansiReset
}

func printHeading(format string, args ...any) {
	message := fmt.Sprintf(format, args...)
	fmt.Printf("\n%s\n", paint(os.Stdout, ansiBoldCyan, "◆ "+message))
}

func printItem(label, format string, args ...any) {
	detail := fmt.Sprintf(format, args...)
	fmt.Printf("  %s  %s\n", paint(os.Stdout, ansiCyan, label), detail)
}

func printSuccess(format string, args ...any) {
	message := fmt.Sprintf(format, args...)
	fmt.Println(paint(os.Stdout, ansiBoldGreen, "✓ "+message))
}

func printWarning(format string, args ...any) {
	message := fmt.Sprintf(format, args...)
	fmt.Println(paint(os.Stdout, ansiYellow, "! "+message))
}

func printFailure(format string, args ...any) {
	message := fmt.Sprintf(format, args...)
	fmt.Fprintln(os.Stderr, paint(os.Stderr, ansiBoldRed, "✗ "+message))
}
