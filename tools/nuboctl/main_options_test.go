package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParseOptionsUsesInstalledServiceUser(t *testing.T) {
	systemdDir := t.TempDir()
	unit := "[Service]\nUser=site-owner\nGroup=site-owner\n"
	if err := os.WriteFile(filepath.Join(systemdDir, "nubo-goapi.service"), []byte(unit), 0o644); err != nil {
		t.Fatal(err)
	}

	options, err := parseOptions("status", []string{"--systemd-dir", systemdDir})
	if err != nil {
		t.Fatal(err)
	}
	if options.serviceUser != "site-owner" {
		t.Fatalf("서비스 사용자 = %q", options.serviceUser)
	}

	override, err := parseOptions("status", []string{"--systemd-dir", systemdDir, "--user", "manual-user"})
	if err != nil {
		t.Fatal(err)
	}
	if override.serviceUser != "manual-user" || !override.userSet {
		t.Fatalf("명시한 서비스 사용자 = %q", override.serviceUser)
	}
}
