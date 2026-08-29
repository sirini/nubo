package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadReleaseSourcesAcceptsPinnedRuntime(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	loaded, err := loadReleaseSources(root, func(string) string { return "" })
	if err != nil {
		t.Fatal(err)
	}
	if loaded.Runtime.Name != sources.Runtime.Name || loaded.GOAPI.Commit != sources.GOAPI.Commit {
		t.Fatalf("loaded descriptor = %+v", loaded)
	}
}

func TestLoadReleaseSourcesRejectsVersionDrift(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	if err := os.WriteFile(filepath.Join(root, "env.sample"), []byte("NUXT_PUBLIC_VERSION=1.3.2\n"), 0644); err != nil {
		t.Fatal(err)
	}
	_, err := loadReleaseSources(root, func(string) string { return "" })
	if err == nil || !strings.Contains(err.Error(), "버전") {
		t.Fatalf("expected version error, got %v", err)
	}
}

func TestLoadReleaseSourcesRejectsUntrustedBaseURLScheme(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	_, err := loadReleaseSources(root, func(name string) string {
		if name == "NUBO_RELEASE_BASE_URL" {
			return "file:///tmp/assets"
		}
		return ""
	})
	if err == nil || !strings.Contains(err.Error(), "NUBO_RELEASE_BASE_URL") {
		t.Fatalf("expected URL error, got %v", err)
	}
}

func TestLoadReleaseSourcesRejectsRemoteHTTPOverride(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	_, err := loadReleaseSources(root, func(name string) string {
		if name == "NUBO_RELEASE_BASE_URL" {
			return "http://example.com/assets"
		}
		return ""
	})
	if err == nil || !strings.Contains(err.Error(), "NUBO_RELEASE_BASE_URL") {
		t.Fatalf("expected remote HTTP error, got %v", err)
	}
}

func TestLoadReleaseSourcesRequiresExplicitMigrationContract(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	path := filepath.Join(root, "deploy", "release-sources.json")
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var descriptor map[string]any
	if err := json.Unmarshal(content, &descriptor); err != nil {
		t.Fatal(err)
	}
	delete(descriptor["runtime"].(map[string]any), "migrationRequired")
	content, _ = json.Marshal(descriptor)
	if err := os.WriteFile(path, content, 0644); err != nil {
		t.Fatal(err)
	}
	_, err = loadReleaseSources(root, func(string) string { return "" })
	if err == nil || !strings.Contains(err.Error(), "migrationRequired") {
		t.Fatalf("expected required migration contract error, got %v", err)
	}
}

func TestLoadReleaseSourcesRejectsUnknownField(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	path := filepath.Join(root, "deploy", "release-sources.json")
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	content = []byte(strings.Replace(string(content), "\n  \"channel\":", "\n  \"typo\": true,\n  \"channel\":", 1))
	if err := os.WriteFile(path, content, 0644); err != nil {
		t.Fatal(err)
	}
	_, err = loadReleaseSources(root, func(string) string { return "" })
	if err == nil || !strings.Contains(err.Error(), "unknown field") {
		t.Fatalf("expected unknown field error, got %v", err)
	}
}
