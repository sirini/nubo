package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type runtimeManifest struct {
	SchemaVersion  int    `json:"schemaVersion"`
	ReleaseVersion string `json:"releaseVersion"`
	Target         struct {
		OS   string `json:"os"`
		Arch string `json:"arch"`
	} `json:"target"`
	APIContract       string `json:"apiContract"`
	MigrationRequired bool   `json:"migrationRequired"`
	GOAPI             struct {
		Version string `json:"version"`
		Commit  string `json:"commit"`
	} `json:"goapi"`
	NativeLibraries struct {
		Libvips   string `json:"libvips"`
		Selection string `json:"selection"`
	} `json:"nativeLibraries"`
}

func extractAndVerifyRuntime(archivePath, projectRoot string, sources releaseSources) (string, runtimeManifest, error) {
	stagingParent := filepath.Join(projectRoot, ".nubo", "staging")
	if err := os.MkdirAll(stagingParent, 0755); err != nil {
		return "", runtimeManifest{}, err
	}
	stageRoot, err := os.MkdirTemp(stagingParent, "runtime-")
	if err != nil {
		return "", runtimeManifest{}, err
	}
	fail := func(err error) (string, runtimeManifest, error) {
		os.RemoveAll(stageRoot)
		return "", runtimeManifest{}, err
	}
	file, err := os.Open(archivePath)
	if err != nil {
		return fail(err)
	}
	defer file.Close()
	compressed, err := gzip.NewReader(file)
	if err != nil {
		return fail(err)
	}
	defer compressed.Close()

	archiveRoot := strings.TrimSuffix(sources.Runtime.Name, ".tar.gz")
	reader := tar.NewReader(compressed)
	files := 0
	var total int64
	for {
		header, nextErr := reader.Next()
		if errors.Is(nextErr, io.EOF) {
			break
		}
		if nextErr != nil {
			return fail(nextErr)
		}
		clean := filepath.ToSlash(filepath.Clean(header.Name))
		if strings.Contains(header.Name, "\\") || strings.HasPrefix(clean, "/") || clean == ".." || strings.HasPrefix(clean, "../") {
			return fail(fmt.Errorf("위험한 runtime 압축 경로입니다: %s", header.Name))
		}
		if clean != archiveRoot && !strings.HasPrefix(clean, archiveRoot+"/") {
			return fail(fmt.Errorf("예상하지 못한 runtime 압축 경로입니다: %s", header.Name))
		}
		relative := strings.TrimPrefix(clean, archiveRoot)
		relative = strings.TrimPrefix(relative, "/")
		if relative == "" {
			continue
		}
		destination := filepath.Join(stageRoot, filepath.FromSlash(relative))
		if !pathWithin(stageRoot, destination) {
			return fail(fmt.Errorf("runtime 압축 경로가 staging을 벗어납니다: %s", header.Name))
		}
		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(destination, 0755); err != nil {
				return fail(err)
			}
		case tar.TypeReg, tar.TypeRegA:
			files++
			total += header.Size
			if files > 1000 || total > maxRuntimeArchiveBytes || header.Size < 0 {
				return fail(errors.New("runtime 압축 내용이 허용 범위를 초과합니다"))
			}
			if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
				return fail(err)
			}
			mode := os.FileMode(0644)
			if relative == "bin/goapi" {
				mode = 0755
			}
			output, err := os.OpenFile(destination, os.O_CREATE|os.O_EXCL|os.O_WRONLY, mode)
			if err != nil {
				return fail(err)
			}
			written, copyErr := io.Copy(output, io.LimitReader(reader, header.Size+1))
			closeErr := output.Close()
			if copyErr != nil || closeErr != nil || written != header.Size {
				return fail(fmt.Errorf("runtime 파일을 완전히 추출하지 못했습니다: %s", relative))
			}
		default:
			return fail(fmt.Errorf("runtime에 링크 또는 특수 파일을 포함할 수 없습니다: %s", header.Name))
		}
	}

	manifestContent, err := os.ReadFile(filepath.Join(stageRoot, "manifest.json"))
	if err != nil {
		return fail(errors.New("runtime manifest가 없습니다"))
	}
	var manifest runtimeManifest
	decoder := json.NewDecoder(bytes.NewReader(manifestContent))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&manifest); err != nil {
		return fail(fmt.Errorf("runtime manifest가 올바르지 않습니다: %w", err))
	}
	if !hasRequiredBoolean(manifestContent, "", "migrationRequired") {
		return fail(errors.New("runtime manifest의 migrationRequired가 없거나 올바르지 않습니다"))
	}
	if manifest.SchemaVersion != 1 || manifest.ReleaseVersion != sources.Channel.Version ||
		manifest.Target.OS != sources.Target.OS || manifest.Target.Arch != sources.Target.Arch ||
		manifest.APIContract != sources.APIContract || manifest.GOAPI.Version != sources.Channel.Version ||
		manifest.GOAPI.Commit != sources.GOAPI.Commit || manifest.NativeLibraries.Libvips != "8.18.3" ||
		manifest.NativeLibraries.Selection != "glibc-hwcaps" {
		return fail(errors.New("runtime manifest가 checkout descriptor와 일치하지 않습니다"))
	}
	if manifest.MigrationRequired != sources.Runtime.MigrationRequired {
		return fail(errors.New("runtime migration 계약이 checkout descriptor와 일치하지 않습니다"))
	}
	if err := verifyRuntimeChecksums(stageRoot); err != nil {
		return fail(err)
	}
	for _, required := range []string{
		"bin/goapi", "lib/libvips-cpp.so.8.18.3",
		"lib/glibc-hwcaps/x86-64-v2/libvips-cpp.so.8.18.3",
		"licenses/sharp-libvips/versions.json",
	} {
		info, err := os.Stat(filepath.Join(stageRoot, filepath.FromSlash(required)))
		if err != nil || !info.Mode().IsRegular() {
			return fail(fmt.Errorf("runtime 필수 파일이 없습니다: %s", required))
		}
	}
	return stageRoot, manifest, nil
}

func verifyRuntimeChecksums(root string) error {
	content, err := os.ReadFile(filepath.Join(root, "checksums.txt"))
	if err != nil {
		return errors.New("runtime checksums.txt가 없습니다")
	}
	expected := map[string]string{}
	for _, line := range strings.Split(string(content), "\n") {
		if strings.TrimSpace(line) == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) != 2 || len(fields[0]) != 64 {
			return errors.New("runtime checksums.txt 형식이 올바르지 않습니다")
		}
		path := strings.TrimPrefix(fields[1], "*")
		path = strings.TrimPrefix(path, "./")
		if path == "checksums.txt" || path == "" || !safeRelativePath(path) {
			return fmt.Errorf("runtime checksum 경로가 올바르지 않습니다: %s", path)
		}
		if _, duplicate := expected[path]; duplicate {
			return fmt.Errorf("runtime checksum 경로가 중복됩니다: %s", path)
		}
		expected[path] = strings.ToLower(fields[0])
	}
	actualFiles := []string{}
	err = filepath.WalkDir(root, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return fmt.Errorf("runtime staging에 링크가 있습니다: %s", path)
		}
		if !entry.Type().IsRegular() || path == filepath.Join(root, "checksums.txt") {
			return nil
		}
		relative, _ := filepath.Rel(root, path)
		actualFiles = append(actualFiles, filepath.ToSlash(relative))
		return nil
	})
	if err != nil {
		return err
	}
	sort.Strings(actualFiles)
	if len(actualFiles) != len(expected) {
		return errors.New("runtime checksum 목록과 실제 파일 개수가 다릅니다")
	}
	for _, path := range actualFiles {
		hash, present := expected[path]
		if !present {
			return fmt.Errorf("checksum에 없는 runtime 파일입니다: %s", path)
		}
		actual, err := fileSHA256(filepath.Join(root, filepath.FromSlash(path)))
		if err != nil {
			return err
		}
		if actual != hash {
			return fmt.Errorf("runtime 파일 checksum이 다릅니다: %s", path)
		}
	}
	return nil
}

func safeRelativePath(path string) bool {
	if strings.Contains(path, "\\") || strings.HasPrefix(path, "/") {
		return false
	}
	clean := filepath.ToSlash(filepath.Clean(path))
	return clean == path && clean != "." && clean != ".." && !strings.HasPrefix(clean, "../")
}

func pathWithin(root, path string) bool {
	relative, err := filepath.Rel(root, path)
	return err == nil && relative != ".." && !strings.HasPrefix(relative, ".."+string(filepath.Separator))
}

func sha256Bytes(content []byte) string {
	value := sha256.Sum256(content)
	return hex.EncodeToString(value[:])
}
