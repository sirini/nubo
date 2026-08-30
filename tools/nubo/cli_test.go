package main

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCLIHelpIsUsefulWithoutTTY(t *testing.T) {
	var output, errors bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &errors)
	if code := application.run(nil); code != 0 {
		t.Fatalf("exit = %d, stderr = %s", code, errors.String())
	}
	for _, expected := range []string{"./bin/nubo search", "./bin/nubo info skins/<key>", "./bin/nubo download", "./bin/nubo update", "자동으로 변경하지 않습니다"} {
		if !strings.Contains(output.String(), expected) {
			t.Fatalf("help missing %q:\n%s", expected, output.String())
		}
	}
}

func TestCLIUpdateJSONKeepsStdoutMachineReadable(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	binary := []byte("current-official-cli")
	destination := filepath.Join(root, ".nubo", "bin", "nubo")
	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(destination, binary, 0755); err != nil {
		t.Fatal(err)
	}
	server := cliServer(t, sources, binary, binary)
	defer server.Close()
	var output, errors bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &errors)
	application.getenv = func(name string) string {
		if name == "NUBO_RELEASE_BASE_URL" {
			return server.URL
		}
		return ""
	}
	if code := application.run([]string{"update", "--root", root, "--json"}); code != 0 {
		t.Fatalf("exit=%d stderr=%s", code, errors.String())
	}
	var result cliUpdateResult
	if err := json.Unmarshal(output.Bytes(), &result); err != nil {
		t.Fatalf("stdout is not JSON: %v\n%s", err, output.String())
	}
	if result.Status != "current" || result.TargetVersion != "1.3.1" {
		t.Fatalf("result=%+v", result)
	}
	if !strings.Contains(errors.String(), "이미 최신 CLI") {
		t.Fatalf("progress missing from stderr: %s", errors.String())
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
