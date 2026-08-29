package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"testing"
)

func testSources(version string) releaseSources {
	var sources releaseSources
	sources.SchemaVersion = 2
	sources.Channel.Version = version
	sources.Channel.Tag = "v" + version
	sources.Channel.Repository = "sirini/nubo"
	sources.Target.OS = "linux"
	sources.Target.Arch = "amd64"
	sources.APIContract = "1"
	sources.CLI = releaseArtifact{Name: "nubo-linux-amd64", Checksum: "nubo-linux-amd64.sha256"}
	sources.Runtime = runtimeArtifact{releaseArtifact: releaseArtifact{Name: "nubo-runtime-" + version + "-linux-amd64.tar.gz", Checksum: "nubo-runtime-" + version + "-linux-amd64.tar.gz.sha256"}}
	sources.GOAPI.Repository = "sirini/goapi"
	sources.GOAPI.Commit = strings.Repeat("a", 40)
	return sources
}

func makeProjectRoot(t *testing.T, sources releaseSources) string {
	t.Helper()
	root := t.TempDir()
	for _, directory := range []string{"deploy", "app/skins"} {
		if err := os.MkdirAll(filepath.Join(root, filepath.FromSlash(directory)), 0755); err != nil {
			t.Fatal(err)
		}
	}
	content, _ := json.MarshalIndent(sources, "", "  ")
	if err := os.WriteFile(filepath.Join(root, "deploy", "release-sources.json"), append(content, '\n'), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "env.sample"), []byte("NUXT_PUBLIC_VERSION="+sources.Channel.Version+"\n"), 0644); err != nil {
		t.Fatal(err)
	}
	return root
}

func runtimeArchive(t *testing.T, sources releaseSources, alter func(map[string][]byte)) []byte {
	return runtimeArchiveCustom(t, sources, alter, nil)
}

func runtimeArchiveCustom(t *testing.T, sources releaseSources, beforeChecksum, afterChecksum func(map[string][]byte)) []byte {
	t.Helper()
	manifest := runtimeManifest{SchemaVersion: 1, ReleaseVersion: sources.Channel.Version, APIContract: sources.APIContract, MigrationRequired: sources.Runtime.MigrationRequired}
	manifest.Target.OS = sources.Target.OS
	manifest.Target.Arch = sources.Target.Arch
	manifest.GOAPI.Version = sources.Channel.Version
	manifest.GOAPI.Commit = sources.GOAPI.Commit
	manifest.NativeLibraries.Libvips = "8.18.3"
	manifest.NativeLibraries.Selection = "glibc-hwcaps"
	manifestContent, _ := json.MarshalIndent(manifest, "", "  ")
	files := map[string][]byte{
		"manifest.json":             append(manifestContent, '\n'),
		"bin/goapi":                 []byte("new-goapi"),
		"lib/libvips-cpp.so.8.18.3": []byte("compat-vips"),
		"lib/glibc-hwcaps/x86-64-v2/libvips-cpp.so.8.18.3": []byte("v2-vips"),
		"licenses/sharp-libvips/versions.json":             []byte("{}\n"),
	}
	if beforeChecksum != nil {
		beforeChecksum(files)
	}
	paths := make([]string, 0, len(files))
	for path := range files {
		paths = append(paths, path)
	}
	sort.Strings(paths)
	var checksums strings.Builder
	for _, path := range paths {
		hash := sha256.Sum256(files[path])
		checksums.WriteString(hex.EncodeToString(hash[:]))
		checksums.WriteString("  ./")
		checksums.WriteString(path)
		checksums.WriteByte('\n')
	}
	files["checksums.txt"] = []byte(checksums.String())
	if afterChecksum != nil {
		afterChecksum(files)
	}
	paths = append(paths, "checksums.txt")
	sort.Strings(paths)

	var output bytes.Buffer
	compressed := gzip.NewWriter(&output)
	archive := tar.NewWriter(compressed)
	root := strings.TrimSuffix(sources.Runtime.Name, ".tar.gz")
	for _, path := range paths {
		content := files[path]
		mode := int64(0644)
		if path == "bin/goapi" {
			mode = 0755
		}
		if err := archive.WriteHeader(&tar.Header{Name: root + "/" + path, Mode: mode, Size: int64(len(content)), Typeflag: tar.TypeReg}); err != nil {
			t.Fatal(err)
		}
		if _, err := archive.Write(content); err != nil {
			t.Fatal(err)
		}
	}
	if err := archive.Close(); err != nil {
		t.Fatal(err)
	}
	if err := compressed.Close(); err != nil {
		t.Fatal(err)
	}
	return output.Bytes()
}

func runtimeServer(t *testing.T, sources releaseSources, archive []byte) *httptest.Server {
	t.Helper()
	hash := sha256.Sum256(archive)
	checksum := hex.EncodeToString(hash[:]) + "  " + sources.Runtime.Name + "\n"
	return httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case "/" + sources.Runtime.Name:
			writer.Header().Set("Content-Length", strconv.Itoa(len(archive)))
			_, _ = writer.Write(archive)
		case "/" + sources.Runtime.Checksum:
			_, _ = writer.Write([]byte(checksum))
		default:
			http.NotFound(writer, request)
		}
	}))
}
