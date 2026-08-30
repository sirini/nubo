package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCLIValidateAndPackLocalMarketSkin(t *testing.T) {
	root := makeProjectRoot(t, testSources("1.3.1"))
	item := writeLocalMarketSkin(t, root, true)

	var output, stderr bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &stderr)
	if code := application.run([]string{"validate", "skins/nubo-test", "--root", root, "--json"}); code != 0 {
		t.Fatalf("validate exit=%d stderr=%s", code, stderr.String())
	}
	var validation marketValidateResult
	if err := json.Unmarshal(output.Bytes(), &validation); err != nil {
		t.Fatalf("validate stdout=%s err=%v", output.String(), err)
	}
	if validation.Status != "valid" || validation.Files != 3 || !validation.Compatible || !validation.ReceiptExcluded {
		t.Fatalf("validation=%+v", validation)
	}

	output.Reset()
	stderr.Reset()
	if code := application.run([]string{"pack", "skins/nubo-test", "--root", root, "--json"}); code != 0 {
		t.Fatalf("pack exit=%d stderr=%s", code, stderr.String())
	}
	var packed marketPackResult
	if err := json.Unmarshal(output.Bytes(), &packed); err != nil {
		t.Fatalf("pack stdout=%s err=%v", output.String(), err)
	}
	if packed.Status != "packed" || !packed.Changed || packed.Files != 3 || packed.PackageSHA256 == "" {
		t.Fatalf("packed=%+v", packed)
	}
	paths := packedMarketPaths(t, packed.PackagePath)
	for _, expected := range []string{"nubo-test/Home.vue", "nubo-test/preview.png", "nubo-test/skin.json"} {
		if !slicesContains(paths, expected) {
			t.Fatalf("package paths missing %s: %v", expected, paths)
		}
	}
	if slicesContains(paths, "nubo-test/"+marketSkinReceiptName) {
		t.Fatalf("package included receipt: %v", paths)
	}

	item.SHA256, item.SizeBytes = packed.PackageSHA256, packed.SizeBytes
	staged, receipt, err := stageMarketSkinPackage(context.Background(), packed.PackagePath, root, item)
	if err != nil {
		t.Fatalf("generated package failed install contract: %v", err)
	}
	defer os.RemoveAll(filepath.Dir(staged))
	if len(receipt.Files) != 3 {
		t.Fatalf("generated receipt=%+v", receipt)
	}

	current, err := packLocalMarketSkin(root, "nubo-test", "1.3.1", "", false)
	if err != nil || current.Status != "current" || current.Changed || current.PackageSHA256 != packed.PackageSHA256 {
		t.Fatalf("current=%+v err=%v", current, err)
	}
}

func TestMarketPackIsDeterministicAndProtectsExistingOutput(t *testing.T) {
	root := makeProjectRoot(t, testSources("1.3.1"))
	writeLocalMarketSkin(t, root, false)
	first, err := packLocalMarketSkin(root, "nubo-test", "1.3.1", "artifacts/first.tar.gz", false)
	if err != nil {
		t.Fatal(err)
	}
	second, err := packLocalMarketSkin(root, "nubo-test", "1.3.1", "artifacts/second.tar.gz", false)
	if err != nil {
		t.Fatal(err)
	}
	if first.PackageSHA256 != second.PackageSHA256 || first.SizeBytes != second.SizeBytes {
		t.Fatalf("packages are not deterministic: %+v / %+v", first, second)
	}
	if err := os.WriteFile(second.PackagePath, []byte("operator artifact"), 0644); err != nil {
		t.Fatal(err)
	}
	_, err = packLocalMarketSkin(root, "nubo-test", "1.3.1", "artifacts/second.tar.gz", false)
	if err == nil || !strings.Contains(err.Error(), "--force") {
		t.Fatalf("expected existing output refusal, got %v", err)
	}
	content, _ := os.ReadFile(second.PackagePath)
	if string(content) != "operator artifact" {
		t.Fatalf("refusal changed existing output: %q", content)
	}
	forced, err := packLocalMarketSkin(root, "nubo-test", "1.3.1", "artifacts/second.tar.gz", true)
	if err != nil || !forced.Changed || forced.PackageSHA256 != first.PackageSHA256 {
		t.Fatalf("forced=%+v err=%v", forced, err)
	}
}

func TestMarketValidateRejectsUnsafeSourceAndOutput(t *testing.T) {
	t.Run("symlink", func(t *testing.T) {
		root := makeProjectRoot(t, testSources("1.3.1"))
		writeLocalMarketSkin(t, root, false)
		directory := filepath.Join(root, "app", "skins", "nubo-test")
		if err := os.Symlink(filepath.Join(directory, "Home.vue"), filepath.Join(directory, "linked.vue")); err != nil {
			t.Fatal(err)
		}
		_, err := validateLocalMarketSkin(root, "nubo-test", "1.3.1")
		if err == nil || !strings.Contains(err.Error(), "링크") {
			t.Fatalf("expected symlink refusal, got %v", err)
		}
	})

	t.Run("receipt symlink", func(t *testing.T) {
		root := makeProjectRoot(t, testSources("1.3.1"))
		writeLocalMarketSkin(t, root, false)
		directory := filepath.Join(root, "app", "skins", "nubo-test")
		if err := os.Symlink(filepath.Join(directory, "skin.json"), filepath.Join(directory, marketSkinReceiptName)); err != nil {
			t.Fatal(err)
		}
		_, err := validateLocalMarketSkin(root, "nubo-test", "1.3.1")
		if err == nil || !strings.Contains(err.Error(), "링크") {
			t.Fatalf("expected receipt symlink refusal, got %v", err)
		}
	})

	t.Run("unknown manifest field", func(t *testing.T) {
		root := makeProjectRoot(t, testSources("1.3.1"))
		writeLocalMarketSkin(t, root, false)
		manifest := filepath.Join(root, "app", "skins", "nubo-test", "skin.json")
		content, err := os.ReadFile(manifest)
		if err != nil {
			t.Fatal(err)
		}
		content = bytes.Replace(content, []byte(`"key"`), []byte(`"unexpected":true,"key"`), 1)
		if err := os.WriteFile(manifest, content, 0644); err != nil {
			t.Fatal(err)
		}
		_, err = validateLocalMarketSkin(root, "nubo-test", "1.3.1")
		if err == nil || !strings.Contains(err.Error(), "unknown field") {
			t.Fatalf("expected manifest refusal, got %v", err)
		}
	})

	t.Run("output inside source", func(t *testing.T) {
		root := makeProjectRoot(t, testSources("1.3.1"))
		writeLocalMarketSkin(t, root, false)
		_, err := packLocalMarketSkin(root, "nubo-test", "1.3.1", "app/skins/nubo-test/package.tar.gz", false)
		if err == nil || !strings.Contains(err.Error(), "source 폴더 밖") {
			t.Fatalf("expected output path refusal, got %v", err)
		}
	})

	t.Run("output symlink", func(t *testing.T) {
		root := makeProjectRoot(t, testSources("1.3.1"))
		writeLocalMarketSkin(t, root, false)
		if err := os.MkdirAll(filepath.Join(root, "artifacts"), 0755); err != nil {
			t.Fatal(err)
		}
		target := filepath.Join(root, "operator-artifact")
		if err := os.WriteFile(target, []byte("preserve me"), 0644); err != nil {
			t.Fatal(err)
		}
		output := filepath.Join(root, "artifacts", "skin.tar.gz")
		if err := os.Symlink(target, output); err != nil {
			t.Fatal(err)
		}
		_, err := packLocalMarketSkin(root, "nubo-test", "1.3.1", output, true)
		if err == nil || !strings.Contains(err.Error(), "일반 파일") {
			t.Fatalf("expected output symlink refusal, got %v", err)
		}
		content, readErr := os.ReadFile(target)
		if readErr != nil || string(content) != "preserve me" {
			t.Fatalf("output symlink target changed: %q err=%v", content, readErr)
		}
	})
}

func writeLocalMarketSkin(t *testing.T, root string, receipt bool) marketSkin {
	t.Helper()
	item := testMarketSkin()
	directory := filepath.Join(root, "app", "skins", item.Key)
	if err := os.MkdirAll(directory, 0755); err != nil {
		t.Fatal(err)
	}
	manifest := marketSkinPackageManifest{
		Key: item.Key, Name: item.Name, Version: item.Version, Author: item.Author, Website: item.Website,
		Description: item.Description, Preview: item.Preview, Screenshots: item.Screenshots,
		Features: item.Features, MinNUBOVersion: item.MinNUBOVersion,
	}
	manifestContent, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	preview, err := base64.StdEncoding.DecodeString("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
	if err != nil {
		t.Fatal(err)
	}
	for name, content := range map[string][]byte{
		"skin.json": append(manifestContent, '\n'), "Home.vue": []byte("<template />"), "preview.png": preview,
	} {
		if err := os.WriteFile(filepath.Join(directory, name), content, 0644); err != nil {
			t.Fatal(err)
		}
	}
	if receipt {
		if err := os.WriteFile(filepath.Join(directory, marketSkinReceiptName), []byte("{}\n"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	return item
}

func packedMarketPaths(t *testing.T, filename string) []string {
	t.Helper()
	file, err := os.Open(filename)
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	compressed, err := gzip.NewReader(file)
	if err != nil {
		t.Fatal(err)
	}
	defer compressed.Close()
	archive := tar.NewReader(compressed)
	paths := []string{}
	for {
		header, err := archive.Next()
		if err == io.EOF {
			return paths
		}
		if err != nil {
			t.Fatal(err)
		}
		paths = append(paths, header.Name)
	}
}

func slicesContains(values []string, expected string) bool {
	for _, value := range values {
		if value == expected {
			return true
		}
	}
	return false
}
