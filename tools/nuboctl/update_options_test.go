package main

import (
	"io"
	"os"
	"testing"
)

// 빈 입력은 백업 완료 확인으로 처리한다.
func TestPromptUpdateBackupAcceptsEnter(t *testing.T) {
	if !runBackupPrompt(t, "\n") {
		t.Fatal("Enter 입력으로 진행하지 않았습니다")
	}
}

// 실수로 입력한 문자를 포함해 빈 입력 이외에는 모두 취소한다.
func TestPromptUpdateBackupCancelsOnAnyText(t *testing.T) {
	if runBackupPrompt(t, "BACKUP\n") {
		t.Fatal("문자열 입력을 진행으로 처리했습니다")
	}
}

func runBackupPrompt(t *testing.T, input string) bool {
	t.Helper()
	file, err := os.CreateTemp(t.TempDir(), "backup-prompt")
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	if _, err := file.WriteString(input); err != nil {
		t.Fatal(err)
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		t.Fatal(err)
	}
	confirmed, err := promptUpdateBackup(newTerminalPrompter(file, io.Discard))()
	if err != nil {
		t.Fatal(err)
	}
	return confirmed
}
