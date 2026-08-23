package main

import "testing"

func TestHelpCoversPublicCommands(t *testing.T) {
	for _, command := range []string{"", "status", "doctor", "update", "customize", "releases", "market", "skin", "activate-nginx", "install", "adopt"} {
		page, ok := helpPages[command]
		if !ok || page.title == "" || page.body == "" {
			t.Fatalf("%q 도움말이 비어 있습니다", command)
		}
	}
	if _, ok := helpPages["unknown"]; ok {
		t.Fatal("알 수 없는 명령에 도움말이 있습니다")
	}
	for _, command := range []string{"", "search", "info", "install", "remove"} {
		page, ok := marketHelpPages[command]
		if !ok || page.title == "" || page.body == "" {
			t.Fatalf("Market %q 도움말이 비어 있습니다", command)
		}
	}
}

func TestNoArgumentsShowsHelpSuccessfully(t *testing.T) {
	if code := run(nil); code != 0 {
		t.Fatalf("인자 없는 도움말 종료 코드 = %d", code)
	}
}

func TestMarketCommandAndSkinAliasAreRouted(t *testing.T) {
	if code := run([]string{"market"}); code != 0 {
		t.Fatalf("인자 없는 market 종료 코드 = %d", code)
	}
	for _, args := range [][]string{{"market", "help"}, {"market", "help", "remove"}, {"market", "install", "--help"}} {
		if code := run(args); code != 0 {
			t.Fatalf("%v 도움말 종료 코드 = %d", args, code)
		}
	}
	if code := run([]string{"market", "help", "unknown"}); code != 2 {
		t.Fatalf("알 수 없는 Market 도움말 종료 코드 = %d", code)
	}
	for _, command := range []string{"market", "skin"} {
		if code := run([]string{command, "unknown"}); code != 1 {
			t.Fatalf("%s 호환 경로 종료 코드 = %d", command, code)
		}
	}
}

func TestReleasesCommandHelpIsRouted(t *testing.T) {
	for _, args := range [][]string{{"releases"}, {"releases", "--help"}, {"help", "releases"}} {
		if code := run(args); code != 0 {
			t.Fatalf("%v 도움말 종료 코드 = %d", args, code)
		}
	}
	if code := run([]string{"releases", "unknown"}); code != 2 {
		t.Fatalf("알 수 없는 releases 명령 종료 코드 = %d", code)
	}
}
