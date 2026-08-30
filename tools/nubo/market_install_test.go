package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"testing"
)

func TestCLIInstallAndUpdateMarketSkinAtomically(t *testing.T) {
	root := makeProjectRoot(t, testSources("1.3.1"))
	item, archive := testInstallPackage(t, "1.0.0", "<template>first</template>")
	registry := newMarketInstallRegistry(t, item, archive)
	defer registry.server.Close()

	result := runMarketInstallCLI(t, root, registry.server.URL, false)
	if result.Status != "installed" || !result.Changed || result.Files != 3 {
		t.Fatalf("initial result=%+v", result)
	}
	destination := filepath.Join(root, "app", "skins", "nubo-test")
	assertMarketSkinBody(t, destination, "<template>first</template>")
	receipt, err := readMarketSkinReceipt(destination, "nubo-test")
	if err != nil || receipt.Version != "1.0.0" || len(receipt.Files) != 3 {
		t.Fatalf("receipt=%+v err=%v", receipt, err)
	}
	if issues, inspectErr := inspectMarketSkin(destination, receipt); inspectErr != nil || len(issues) != 0 {
		t.Fatalf("fresh install issues=%v err=%v", issues, inspectErr)
	}

	item, archive = testInstallPackage(t, "1.1.0", "<template>updated</template>")
	registry.set(item, archive, nil)
	result = runMarketInstallCLI(t, root, registry.server.URL, false)
	if result.Status != "updated" || result.PreviousVersion != "1.0.0" || !result.Changed {
		t.Fatalf("update result=%+v", result)
	}
	assertMarketSkinBody(t, destination, "<template>updated</template>")
	receipt, err = readMarketSkinReceipt(destination, "nubo-test")
	if err != nil || receipt.Version != "1.1.0" {
		t.Fatalf("updated receipt=%+v err=%v", receipt, err)
	}

	downloads := registry.downloadCount()
	result = runMarketInstallCLI(t, root, registry.server.URL, false)
	if result.Status != "current" || result.Changed || registry.downloadCount() != downloads {
		t.Fatalf("current result=%+v downloads=%d->%d", result, downloads, registry.downloadCount())
	}
}

func TestCLIInstallDryRunLeavesSkinSourceUntouched(t *testing.T) {
	root := makeProjectRoot(t, testSources("1.3.1"))
	item, archive := testInstallPackage(t, "1.0.0", "<template>dry</template>")
	registry := newMarketInstallRegistry(t, item, archive)
	defer registry.server.Close()

	result := runMarketInstallCLI(t, root, registry.server.URL, true)
	if result.Status != "dry-run" || result.Changed || result.Files != 3 {
		t.Fatalf("result=%+v", result)
	}
	if _, err := os.Lstat(filepath.Join(root, "app", "skins", "nubo-test")); !os.IsNotExist(err) {
		t.Fatalf("dry-run changed destination: %v", err)
	}
}

func TestMarketInstallRefusesUnmanagedOrLocallyChangedSkin(t *testing.T) {
	t.Run("unmanaged", func(t *testing.T) {
		root := makeProjectRoot(t, testSources("1.3.1"))
		destination := filepath.Join(root, "app", "skins", "nubo-test")
		if err := os.Mkdir(destination, 0755); err != nil {
			t.Fatal(err)
		}
		item, archive := testInstallPackage(t, "1.0.0", "<template />")
		registry := newMarketInstallRegistry(t, item, archive)
		defer registry.server.Close()
		stderr := runMarketInstallCLIError(t, root, registry.server.URL)
		if !strings.Contains(stderr, "설치 영수증이 없어") || registry.downloadCount() != 0 {
			t.Fatalf("stderr=%s downloads=%d", stderr, registry.downloadCount())
		}
	})

	for _, test := range []struct {
		name   string
		change func(string) error
		want   string
	}{
		{"modified", func(destination string) error {
			return os.WriteFile(filepath.Join(destination, "Home.vue"), []byte("operator change"), 0644)
		}, "checksum 변경됨"},
		{"added file", func(destination string) error {
			return os.WriteFile(filepath.Join(destination, "note.txt"), []byte("keep"), 0644)
		}, "영수증에 없는 파일"},
		{"added directory", func(destination string) error {
			return os.Mkdir(filepath.Join(destination, "keep"), 0755)
		}, "영수증에 없는 폴더"},
		{"missing", func(destination string) error {
			return os.Remove(filepath.Join(destination, "Home.vue"))
		}, "파일 누락"},
	} {
		t.Run(test.name, func(t *testing.T) {
			root, destination, registry := installedMarketSkinFixture(t)
			defer registry.server.Close()
			if err := test.change(destination); err != nil {
				t.Fatal(err)
			}
			item, archive := testInstallPackage(t, "1.1.0", "<template>new</template>")
			registry.set(item, archive, nil)
			stderr := runMarketInstallCLIError(t, root, registry.server.URL)
			if !strings.Contains(stderr, test.want) || registry.downloadCount() != 1 {
				// fixture의 최초 설치가 다운로드 1회이며 거부된 업데이트는 다운로드하지 않아야 한다.
				t.Fatalf("stderr=%s downloads=%d", stderr, registry.downloadCount())
			}
		})
	}
}

func TestMarketInstallStopsOnConcurrentLocalChange(t *testing.T) {
	root, destination, registry := installedMarketSkinFixture(t)
	defer registry.server.Close()
	item, archive := testInstallPackage(t, "1.1.0", "<template>new</template>")
	registry.set(item, archive, func() {
		if err := os.WriteFile(filepath.Join(destination, "Home.vue"), []byte("concurrent change"), 0644); err != nil {
			t.Error(err)
		}
	})
	stderr := runMarketInstallCLIError(t, root, registry.server.URL)
	if !strings.Contains(stderr, "준비 중 로컬 스킨이 바뀌어") {
		t.Fatalf("stderr=%s", stderr)
	}
	assertMarketSkinBody(t, destination, "concurrent change")
}

func TestMarketInstallRejectsChecksumTraversalAndReservedReceipt(t *testing.T) {
	for _, test := range []struct {
		name    string
		archive func(*testing.T, marketSkin) []byte
		mutate  func(*marketSkin)
		want    string
	}{
		{
			name: "checksum",
			archive: func(t *testing.T, item marketSkin) []byte {
				return testInstallArchive(t, item, map[string][]byte{item.Key + "/Home.vue": []byte("<template />")})
			},
			mutate: func(item *marketSkin) { item.SHA256 = strings.Repeat("0", 64) },
			want:   "SHA-256",
		},
		{
			name: "traversal",
			archive: func(t *testing.T, _ marketSkin) []byte {
				return testRawSkinArchive(t, map[string][]byte{"../outside": []byte("escape")})
			},
			want: "안전하지 않은",
		},
		{
			name: "reserved receipt",
			archive: func(t *testing.T, item marketSkin) []byte {
				return testInstallArchive(t, item, map[string][]byte{item.Key + "/" + marketSkinReceiptName: []byte("{}")})
			},
			want: "예약 파일",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			root := makeProjectRoot(t, testSources("1.3.1"))
			item := testMarketSkin()
			archive := test.archive(t, item)
			hash := sha256.Sum256(archive)
			item.SHA256, item.SizeBytes = hex.EncodeToString(hash[:]), int64(len(archive))
			if test.mutate != nil {
				test.mutate(&item)
			}
			registry := newMarketInstallRegistry(t, item, archive)
			defer registry.server.Close()
			stderr := runMarketInstallCLIError(t, root, registry.server.URL)
			if !strings.Contains(stderr, test.want) {
				t.Fatalf("stderr=%s", stderr)
			}
			if _, err := os.Lstat(filepath.Join(root, "app", "skins", "nubo-test")); !os.IsNotExist(err) {
				t.Fatalf("unsafe package changed destination: %v", err)
			}
			if _, err := os.Lstat(filepath.Join(root, "outside")); !os.IsNotExist(err) {
				t.Fatalf("traversal created outside file: %v", err)
			}
		})
	}
}

func TestMarketInstallRejectsIncompatibleNUBOVersionBeforeDownload(t *testing.T) {
	root := makeProjectRoot(t, testSources("1.3.1"))
	item, archive := testInstallPackage(t, "1.0.0", "<template />")
	item.MinNUBOVersion = "2.0.0"
	// manifest도 같은 계약으로 다시 만들어 checksum을 맞춘다.
	archive = testInstallArchive(t, item, nil)
	hash := sha256.Sum256(archive)
	item.SHA256, item.SizeBytes = hex.EncodeToString(hash[:]), int64(len(archive))
	registry := newMarketInstallRegistry(t, item, archive)
	defer registry.server.Close()
	stderr := runMarketInstallCLIError(t, root, registry.server.URL)
	if !strings.Contains(stderr, "NUBO 2.0.0 이상") || registry.downloadCount() != 0 {
		t.Fatalf("stderr=%s downloads=%d", stderr, registry.downloadCount())
	}
}

func TestReplaceMarketSkinRestoresExistingSourceWhenRenameFails(t *testing.T) {
	parent := t.TempDir()
	destination := filepath.Join(parent, "nubo-test")
	if err := os.Mkdir(destination, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(destination, "Home.vue"), []byte("existing"), 0644); err != nil {
		t.Fatal(err)
	}
	err := replaceMarketSkin(destination, filepath.Join(parent, "missing-stage"))
	if err == nil {
		t.Fatal("expected staged rename failure")
	}
	assertMarketSkinBody(t, destination, "existing")
	matches, globErr := filepath.Glob(filepath.Join(parent, ".nubo-skin-backup-*"))
	if globErr != nil || len(matches) != 0 {
		t.Fatalf("rollback left backups: %v, %v", matches, globErr)
	}
}

type marketInstallRegistry struct {
	mu         sync.Mutex
	item       marketSkin
	archive    []byte
	downloads  int
	onDownload func()
	server     *httptest.Server
}

func newMarketInstallRegistry(t *testing.T, item marketSkin, archive []byte) *marketInstallRegistry {
	t.Helper()
	registry := &marketInstallRegistry{item: item, archive: append([]byte(nil), archive...)}
	registry.server = httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		registry.mu.Lock()
		item := registry.item
		archive := append([]byte(nil), registry.archive...)
		onDownload := registry.onDownload
		isDownload := strings.HasSuffix(request.URL.Path, "/download")
		if isDownload {
			registry.downloads++
		}
		registry.mu.Unlock()
		if isDownload {
			if onDownload != nil {
				onDownload()
			}
			_, _ = writer.Write(archive)
			return
		}
		if request.URL.Path != "/v1/skins/"+item.Key {
			http.NotFound(writer, request)
			return
		}
		_ = json.NewEncoder(writer).Encode(item)
	}))
	return registry
}

func (registry *marketInstallRegistry) set(item marketSkin, archive []byte, onDownload func()) {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	registry.item, registry.archive, registry.onDownload = item, append([]byte(nil), archive...), onDownload
}

func (registry *marketInstallRegistry) downloadCount() int {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	return registry.downloads
}

func runMarketInstallCLI(t *testing.T, root, baseURL string, dryRun bool) marketInstallResult {
	t.Helper()
	args := []string{"install", "skins/nubo-test", "--root", root, "--json"}
	if dryRun {
		args = append(args, "--dry-run")
	}
	var output, stderr bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &stderr)
	application.getenv = marketTestEnv(baseURL)
	if code := application.run(args); code != 0 {
		t.Fatalf("exit=%d stderr=%s", code, stderr.String())
	}
	var result marketInstallResult
	if err := json.Unmarshal(output.Bytes(), &result); err != nil {
		t.Fatalf("stdout is not JSON: %v\n%s", err, output.String())
	}
	return result
}

func runMarketInstallCLIError(t *testing.T, root, baseURL string) string {
	t.Helper()
	var output, stderr bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &stderr)
	application.getenv = marketTestEnv(baseURL)
	if code := application.run([]string{"install", "skins/nubo-test", "--root", root, "--json"}); code != 1 {
		t.Fatalf("exit=%d stdout=%s stderr=%s", code, output.String(), stderr.String())
	}
	if output.Len() != 0 {
		t.Fatalf("failed JSON command wrote stdout: %s", output.String())
	}
	return stderr.String()
}

func installedMarketSkinFixture(t *testing.T) (string, string, *marketInstallRegistry) {
	t.Helper()
	root := makeProjectRoot(t, testSources("1.3.1"))
	item, archive := testInstallPackage(t, "1.0.0", "<template>first</template>")
	registry := newMarketInstallRegistry(t, item, archive)
	_ = runMarketInstallCLI(t, root, registry.server.URL, false)
	return root, filepath.Join(root, "app", "skins", "nubo-test"), registry
}

func testInstallPackage(t *testing.T, version, home string) (marketSkin, []byte) {
	t.Helper()
	item := testMarketSkin()
	item.Version = version
	archive := testInstallArchive(t, item, map[string][]byte{item.Key + "/Home.vue": []byte(home)})
	hash := sha256.Sum256(archive)
	item.SHA256, item.SizeBytes = hex.EncodeToString(hash[:]), int64(len(archive))
	return item, archive
}

func testInstallArchive(t *testing.T, item marketSkin, extra map[string][]byte) []byte {
	t.Helper()
	manifest := marketSkinPackageManifest{
		Key: item.Key, Name: item.Name, Version: item.Version, Author: item.Author, Website: item.Website,
		Description: item.Description, Preview: item.Preview, Screenshots: item.Screenshots,
		Features: item.Features, MinNUBOVersion: item.MinNUBOVersion,
	}
	manifestContent, err := json.Marshal(manifest)
	if err != nil {
		t.Fatal(err)
	}
	preview, err := base64.StdEncoding.DecodeString("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
	if err != nil {
		t.Fatal(err)
	}
	files := map[string][]byte{
		item.Key + "/skin.json":       manifestContent,
		item.Key + "/Home.vue":        []byte("<template />"),
		item.Key + "/" + item.Preview: preview,
	}
	for name, content := range extra {
		files[name] = content
	}
	return testRawSkinArchive(t, files)
}

func testRawSkinArchive(t *testing.T, files map[string][]byte) []byte {
	t.Helper()
	paths := make([]string, 0, len(files))
	for name := range files {
		paths = append(paths, name)
	}
	sort.Strings(paths)
	var output bytes.Buffer
	compressed := gzip.NewWriter(&output)
	archive := tar.NewWriter(compressed)
	for _, name := range paths {
		content := files[name]
		if err := archive.WriteHeader(&tar.Header{Name: name, Mode: 0644, Size: int64(len(content)), Typeflag: tar.TypeReg}); err != nil {
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

func assertMarketSkinBody(t *testing.T, destination, want string) {
	t.Helper()
	content, err := os.ReadFile(filepath.Join(destination, "Home.vue"))
	if err != nil || string(content) != want {
		t.Fatalf("Home.vue=%q err=%v want=%q", content, err, want)
	}
}
