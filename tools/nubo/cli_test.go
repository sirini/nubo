package main

import (
	"bytes"
	"strings"
	"testing"
)

func TestCLIHelpIsUsefulWithoutTTY(t *testing.T) {
	var output, errors bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &errors)
	if code := application.run(nil); code != 0 {
		t.Fatalf("exit = %d, stderr = %s", code, errors.String())
	}
	for _, expected := range []string{"./bin/nubo download", "자동으로 변경하지 않습니다"} {
		if !strings.Contains(output.String(), expected) {
			t.Fatalf("help missing %q:\n%s", expected, output.String())
		}
	}
}

func TestCLIRejectsUnknownCommand(t *testing.T) {
	var output, errors bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &errors)
	if code := application.run([]string{"restart"}); code != 2 {
		t.Fatalf("exit = %d", code)
	}
	if !strings.Contains(errors.String(), "알 수 없는 명령") {
		t.Fatalf("stderr = %s", errors.String())
	}
}
