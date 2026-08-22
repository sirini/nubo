package main

import "testing"

func TestHelpCoversPublicCommands(t *testing.T) {
	for _, command := range []string{"", "status", "doctor", "update", "customize", "skin", "activate-nginx", "install", "adopt"} {
		page, ok := helpPages[command]
		if !ok || page.title == "" || page.body == "" {
			t.Fatalf("%q 도움말이 비어 있습니다", command)
		}
	}
	if _, ok := helpPages["unknown"]; ok {
		t.Fatal("알 수 없는 명령에 도움말이 있습니다")
	}
}

func TestNoArgumentsShowsHelpSuccessfully(t *testing.T) {
	if code := run(nil); code != 0 {
		t.Fatalf("인자 없는 도움말 종료 코드 = %d", code)
	}
}
