package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestInstallRuntimeRollsBackOnPartialFailure(t *testing.T) {
	root := t.TempDir()
	stage := t.TempDir()
	for _, directory := range []string{"bin", "lib", "licenses/sharp-libvips"} {
		if err := os.MkdirAll(filepath.Join(stage, filepath.FromSlash(directory)), 0755); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.MkdirAll(filepath.Join(root, "bin"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, "lib"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "bin", "goapi"), []byte("old-goapi"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "lib", "old.so"), []byte("old-lib"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "licenses"), []byte("blocks-directory"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stage, "bin", "goapi"), []byte("new-goapi"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stage, "lib", "new.so"), []byte("new-lib"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stage, "licenses", "sharp-libvips", "versions.json"), []byte("{}"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, ".nubo"), 0755); err != nil {
		t.Fatal(err)
	}

	err := installRuntime(root, stage, runtimeManifest{}, runtimeReceipt{})
	if err == nil {
		t.Fatal("expected install failure")
	}
	goapi, _ := os.ReadFile(filepath.Join(root, "bin", "goapi"))
	oldLibrary, oldErr := os.ReadFile(filepath.Join(root, "lib", "old.so"))
	if string(goapi) != "old-goapi" || oldErr != nil || string(oldLibrary) != "old-lib" {
		t.Fatalf("rollback failed: goapi=%q lib=%q err=%v", goapi, oldLibrary, oldErr)
	}
	if _, err := os.Stat(filepath.Join(root, "lib", "new.so")); !os.IsNotExist(err) {
		t.Fatalf("new library remained after rollback: %v", err)
	}
}
