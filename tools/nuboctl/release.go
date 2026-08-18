package main

import (
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
)

type releaseManifest struct {
	SchemaVersion  int    `json:"schemaVersion"`
	ReleaseVersion string `json:"releaseVersion"`
	Target         struct {
		OS   string `json:"os"`
		Arch string `json:"arch"`
	} `json:"target"`
	Components map[string]struct {
		Version string `json:"version"`
		Commit  string `json:"commit"`
		Dirty   bool   `json:"dirty"`
	} `json:"components"`
}

// 릴리스 manifest를 읽고 지원하는 최소 형식인지 확인한다.
func readManifest(releaseDir string) (releaseManifest, error) {
	var manifest releaseManifest
	contents, err := os.ReadFile(filepath.Join(releaseDir, "manifest.json"))
	if err != nil {
		return manifest, err
	}
	if err := json.Unmarshal(contents, &manifest); err != nil {
		return manifest, err
	}
	if manifest.SchemaVersion != 1 || manifest.ReleaseVersion == "" {
		return manifest, fmt.Errorf("지원하지 않는 manifest 형식입니다")
	}
	return manifest, nil
}

// manifest 대상과 선택적인 checksum 결과를 진단 항목으로 만든다.
func checkRelease(releaseDir string, verifyChecksums bool) []checkResult {
	manifest, err := readManifest(releaseDir)
	if err != nil {
		return []checkResult{fail("릴리스 manifest", err.Error())}
	}
	results := []checkResult{pass("릴리스 manifest", "NUBO "+manifest.ReleaseVersion)}
	if manifest.Target.OS != runtime.GOOS || manifest.Target.Arch != runtime.GOARCH {
		results = append(results, fail("릴리스 대상", fmt.Sprintf("%s/%s 릴리스는 현재 %s/%s와 호환되지 않습니다", manifest.Target.OS, manifest.Target.Arch, runtime.GOOS, runtime.GOARCH)))
	} else {
		results = append(results, pass("릴리스 대상", manifest.Target.OS+"/"+manifest.Target.Arch))
	}
	componentNames := make([]string, 0, len(manifest.Components))
	for name := range manifest.Components {
		componentNames = append(componentNames, name)
	}
	sort.Strings(componentNames)
	for _, name := range componentNames {
		component := manifest.Components[name]
		if component.Dirty {
			results = append(results, warn("컴포넌트 "+name, component.Version+" 개발 작업 트리에서 생성됨"))
		}
	}
	if verifyChecksums {
		if err := verifyReleaseChecksums(releaseDir); err != nil {
			results = append(results, fail("릴리스 checksum", err.Error()))
		} else {
			results = append(results, pass("릴리스 checksum", "모든 파일이 일치합니다"))
		}
	}
	return results
}

// 목록에 기록된 파일만 검증하며 운영자가 추가한 파일은 허용한다.
func verifyReleaseChecksums(releaseDir string) error {
	file, err := os.Open(filepath.Join(releaseDir, "checksums.txt"))
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	count := 0
	checked := make(map[string]bool)
	for scanner.Scan() {
		line := scanner.Text()
		if len(line) < 67 {
			return fmt.Errorf("잘못된 checksum 줄: %q", line)
		}
		expected := line[:64]
		if _, err := hex.DecodeString(expected); err != nil {
			return fmt.Errorf("잘못된 SHA-256 값: %q", expected)
		}
		relative := strings.TrimSpace(line[64:])
		relative = strings.TrimPrefix(relative, "*")
		relative = strings.TrimPrefix(relative, "./")
		if relative == "" || filepath.IsAbs(relative) {
			return fmt.Errorf("잘못된 checksum 경로: %q", relative)
		}
		clean := filepath.Clean(relative)
		if clean == ".." || strings.HasPrefix(clean, ".."+string(filepath.Separator)) {
			return fmt.Errorf("릴리스 밖을 가리키는 checksum 경로: %q", relative)
		}
		if checked[clean] {
			return fmt.Errorf("중복된 checksum 경로: %q", relative)
		}
		filePath := filepath.Join(releaseDir, clean)
		if err := ensureResolvedInside(releaseDir, filePath); err != nil {
			return err
		}
		actual, err := fileSHA256(filePath)
		if err != nil {
			return fmt.Errorf("%s: %w", clean, err)
		}
		if actual != expected {
			return fmt.Errorf("%s checksum 불일치", clean)
		}
		checked[clean] = true
		count++
	}
	if err := scanner.Err(); err != nil {
		return err
	}
	if count == 0 {
		return fmt.Errorf("checksum 항목이 없습니다")
	}
	return nil
}

// checksum에 기록된 경로가 심볼릭 링크로 릴리스 밖을 가리키지 않도록 막는다.
func ensureResolvedInside(root, target string) error {
	rootPath, err := filepath.EvalSymlinks(root)
	if err != nil {
		return err
	}
	targetPath, err := filepath.EvalSymlinks(target)
	if err != nil {
		return err
	}
	relative, err := filepath.Rel(rootPath, targetPath)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return fmt.Errorf("릴리스 밖을 가리키는 심볼릭 링크: %s", target)
	}
	return nil
}

// 지정한 일반 파일의 SHA-256 값을 소문자 16진수로 계산한다.
func fileSHA256(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}
