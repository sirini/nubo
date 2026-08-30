package main

import (
	"archive/tar"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type marketValidateResult struct {
	Status          string `json:"status"`
	Coordinate      string `json:"coordinate"`
	Version         string `json:"version"`
	MinNUBOVersion  string `json:"minNUBOVersion"`
	Compatible      bool   `json:"compatible"`
	Directory       string `json:"directory"`
	Files           int    `json:"files"`
	ExpandedBytes   int64  `json:"expandedBytes"`
	ReceiptExcluded bool   `json:"receiptExcluded"`
}

type marketPackResult struct {
	Status        string `json:"status"`
	Coordinate    string `json:"coordinate"`
	Version       string `json:"version"`
	PackagePath   string `json:"packagePath"`
	PackageSHA256 string `json:"packageSha256"`
	SizeBytes     int64  `json:"sizeBytes"`
	Files         int    `json:"files"`
	Changed       bool   `json:"changed"`
}

type localMarketSkinFile struct {
	path   string
	size   int64
	sha256 string
	info   os.FileInfo
}

type localMarketSkin struct {
	result   marketValidateResult
	manifest marketSkinPackageManifest
	files    []localMarketSkinFile
}

func validateLocalMarketSkin(root, key, nuboVersion string) (localMarketSkin, error) {
	directory := filepath.Join(root, "app", "skins", key)
	result := marketValidateResult{Status: "valid", Coordinate: "skins/" + key, Directory: directory}
	info, err := os.Lstat(directory)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return localMarketSkin{}, fmt.Errorf("검증할 스킨 폴더를 찾을 수 없습니다: %s", directory)
	}
	manifest, err := readMarketSkinManifest(filepath.Join(directory, "skin.json"))
	if err != nil {
		return localMarketSkin{}, err
	}
	if err := validateLocalMarketManifest(manifest, key); err != nil {
		return localMarketSkin{}, err
	}
	result.Version = manifest.Version
	result.MinNUBOVersion = manifest.MinNUBOVersion
	result.Compatible = versionAtLeast(nuboVersion, manifest.MinNUBOVersion)

	files := make([]localMarketSkinFile, 0)
	hasEntry := false
	err = filepath.WalkDir(directory, func(filename string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if filename == directory {
			return nil
		}
		relative, err := filepath.Rel(directory, filename)
		if err != nil {
			return err
		}
		relative = filepath.ToSlash(relative)
		if entry.Type()&os.ModeSymlink != 0 {
			return fmt.Errorf("스킨 source에 링크를 포함할 수 없습니다: %s", relative)
		}
		if entry.IsDir() {
			if !safeMarketReceiptPath(relative) {
				return fmt.Errorf("스킨 source 경로가 올바르지 않습니다: %s", relative)
			}
			return nil
		}
		if !entry.Type().IsRegular() {
			return fmt.Errorf("스킨 source에 특수 파일을 포함할 수 없습니다: %s", relative)
		}
		if relative == marketSkinReceiptName {
			result.ReceiptExcluded = true
			return nil
		}
		if !safeMarketReceiptPath(relative) {
			return fmt.Errorf("스킨 source 경로가 올바르지 않습니다: %s", relative)
		}
		fileInfo, err := entry.Info()
		if err != nil {
			return err
		}
		result.Files++
		result.ExpandedBytes += fileInfo.Size()
		if result.Files > maxMarketSkinFiles || result.ExpandedBytes > maxMarketSkinExpandedBytes {
			return errors.New("스킨 source가 Market 파일 수 또는 압축 해제 크기 한계를 초과합니다")
		}
		checksum, err := fileSHA256(filename)
		if err != nil {
			return err
		}
		files = append(files, localMarketSkinFile{path: relative, size: fileInfo.Size(), sha256: checksum, info: fileInfo})
		if !strings.Contains(relative, "/") && marketSkinEntryFiles[relative] {
			hasEntry = true
		}
		return nil
	})
	if err != nil {
		return localMarketSkin{}, err
	}
	if !hasEntry {
		return localMarketSkin{}, errors.New("스킨 source에 지원되는 최상위 Vue entry가 없습니다")
	}
	if err := verifyMarketSkinAssets(directory, manifest); err != nil {
		return localMarketSkin{}, err
	}
	sort.Slice(files, func(left, right int) bool { return files[left].path < files[right].path })
	return localMarketSkin{result: result, manifest: manifest, files: files}, nil
}

func validateLocalMarketManifest(manifest marketSkinPackageManifest, key string) error {
	if manifest.Key != key || !marketKeyPattern.MatchString(manifest.Key) {
		return errors.New("skin.json key가 package 좌표와 일치하지 않습니다")
	}
	if !marketVersionPattern.MatchString(manifest.Version) || !marketVersionPattern.MatchString(manifest.MinNUBOVersion) {
		return errors.New("skin.json version과 min_nubo_version은 x.y.z 형식이어야 합니다")
	}
	for field, value := range map[string]string{
		"name": manifest.Name, "author": manifest.Author, "description": manifest.Description, "preview": manifest.Preview,
	} {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("skin.json %s 값이 필요합니다", field)
		}
	}
	if len(manifest.Name) > 160 || len(manifest.Author) > 160 || len(manifest.Website) > 500 || len(manifest.Preview) > 500 || len(manifest.Description) > 65535 {
		return errors.New("skin.json 문자열이 Market 길이 한계를 초과합니다")
	}
	website, err := url.ParseRequestURI(manifest.Website)
	if err != nil || (website.Scheme != "http" && website.Scheme != "https") || website.Host == "" {
		return errors.New("skin.json website는 http(s) URL이어야 합니다")
	}
	if len(manifest.Features) > 30 {
		return errors.New("skin.json features는 30개를 초과할 수 없습니다")
	}
	for _, feature := range manifest.Features {
		if strings.TrimSpace(feature) == "" || len(feature) > 100 {
			return errors.New("skin.json feature 이름은 1~100 bytes여야 합니다")
		}
	}
	if len(manifest.Screenshots) > 9 {
		return errors.New("skin.json screenshots는 9개를 초과할 수 없습니다")
	}
	for _, screenshot := range manifest.Screenshots {
		if len(screenshot) > 500 {
			return errors.New("skin.json screenshot 경로는 500 bytes를 초과할 수 없습니다")
		}
	}
	return nil
}

func packLocalMarketSkin(root, key, nuboVersion, output string, force bool) (marketPackResult, error) {
	local, err := validateLocalMarketSkin(root, key, nuboVersion)
	if err != nil {
		return marketPackResult{}, err
	}
	if output == "" {
		output = filepath.Join(root, ".nubo", "packages", fmt.Sprintf("%s-%s.tar.gz", key, local.manifest.Version))
	} else if !filepath.IsAbs(output) {
		output = filepath.Join(root, filepath.FromSlash(output))
	}
	output, err = filepath.Abs(output)
	if err != nil {
		return marketPackResult{}, err
	}
	if pathWithin(local.result.Directory, output) {
		return marketPackResult{}, errors.New("package 출력 경로는 스킨 source 폴더 밖이어야 합니다")
	}
	if err := os.MkdirAll(filepath.Dir(output), 0755); err != nil {
		return marketPackResult{}, err
	}
	temporary, err := os.CreateTemp(filepath.Dir(output), ".skin-package-*.tar.gz")
	if err != nil {
		return marketPackResult{}, err
	}
	temporaryPath := temporary.Name()
	defer os.Remove(temporaryPath)
	if err := writeDeterministicMarketSkinPackage(temporary, local); err != nil {
		_ = temporary.Close()
		return marketPackResult{}, err
	}
	if err := temporary.Sync(); err != nil {
		_ = temporary.Close()
		return marketPackResult{}, err
	}
	if err := temporary.Close(); err != nil {
		return marketPackResult{}, err
	}
	info, err := os.Stat(temporaryPath)
	if err != nil {
		return marketPackResult{}, err
	}
	if info.Size() > maxMarketSkinPackageBytes {
		return marketPackResult{}, errors.New("생성한 skin package가 20MiB 한계를 초과합니다")
	}
	checksum, err := fileSHA256(temporaryPath)
	if err != nil {
		return marketPackResult{}, err
	}
	result := marketPackResult{
		Status: "packed", Coordinate: local.result.Coordinate, Version: local.result.Version,
		PackagePath: output, PackageSHA256: checksum, SizeBytes: info.Size(), Files: local.result.Files,
	}
	outputInfo, outputErr := os.Lstat(output)
	if outputErr == nil && (!outputInfo.Mode().IsRegular() || outputInfo.Mode()&os.ModeSymlink != 0) {
		return marketPackResult{}, fmt.Errorf("기존 package 출력은 일반 파일이어야 합니다: %s", output)
	}
	if outputErr != nil && !errors.Is(outputErr, os.ErrNotExist) {
		return marketPackResult{}, outputErr
	}
	if current, err := fileSHA256(output); err == nil {
		if current == checksum {
			result.Status = "current"
			return result, nil
		}
		if !force {
			return marketPackResult{}, fmt.Errorf("다른 package 파일이 이미 있습니다: %s (--force로 교체)", output)
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return marketPackResult{}, err
	}
	if err := os.Chmod(temporaryPath, 0644); err != nil {
		return marketPackResult{}, err
	}
	if err := os.Rename(temporaryPath, output); err != nil {
		return marketPackResult{}, fmt.Errorf("skin package를 원자적으로 배치할 수 없습니다: %w", err)
	}
	result.Changed = true
	return result, nil
}

func writeDeterministicMarketSkinPackage(output *os.File, local localMarketSkin) error {
	compressed, err := gzip.NewWriterLevel(output, gzip.BestCompression)
	if err != nil {
		return err
	}
	compressed.Header.ModTime = time.Unix(0, 0).UTC()
	compressed.Header.OS = 255
	archive := tar.NewWriter(compressed)
	fail := func(err error) error {
		_ = archive.Close()
		_ = compressed.Close()
		return err
	}
	for _, source := range local.files {
		filename := filepath.Join(local.result.Directory, filepath.FromSlash(source.path))
		pathInfo, err := os.Lstat(filename)
		if err != nil || !pathInfo.Mode().IsRegular() || !os.SameFile(pathInfo, source.info) {
			return fail(fmt.Errorf("pack 준비 중 source 파일이 바뀌었습니다: %s", source.path))
		}
		file, err := os.Open(filename)
		if err != nil {
			return fail(err)
		}
		openedInfo, statErr := file.Stat()
		if statErr != nil || !openedInfo.Mode().IsRegular() || !os.SameFile(pathInfo, openedInfo) || openedInfo.Size() != source.size {
			_ = file.Close()
			return fail(fmt.Errorf("pack 준비 중 source 파일이 바뀌었습니다: %s", source.path))
		}
		header := &tar.Header{
			Name: local.manifest.Key + "/" + source.path, Mode: 0644, Size: source.size,
			ModTime: time.Unix(0, 0).UTC(), Typeflag: tar.TypeReg,
		}
		if err := archive.WriteHeader(header); err != nil {
			_ = file.Close()
			return fail(err)
		}
		hash := sha256.New()
		written, copyErr := io.Copy(io.MultiWriter(archive, hash), io.LimitReader(file, source.size+1))
		closeErr := file.Close()
		if copyErr != nil || closeErr != nil || written != source.size || hex.EncodeToString(hash.Sum(nil)) != source.sha256 {
			return fail(fmt.Errorf("pack 중 source 파일이 바뀌었습니다: %s", source.path))
		}
	}
	if err := archive.Close(); err != nil {
		_ = compressed.Close()
		return err
	}
	return compressed.Close()
}

func printMarketValidation(writer io.Writer, result marketValidateResult, color bool) {
	styles := newPalette(color)
	fmt.Fprintln(writer)
	fmt.Fprintln(writer, render(styles.success, "✓ Market 스킨 검증 완료"))
	fmt.Fprintf(writer, "  %s@%s · 파일 %d개 · %s\n", result.Coordinate, result.Version, result.Files, humanBytes(result.ExpandedBytes))
	fmt.Fprintf(writer, "  최소 NUBO %s", result.MinNUBOVersion)
	if result.Compatible {
		fmt.Fprintln(writer, render(styles.success, " · 현재 checkout과 호환"))
	} else {
		fmt.Fprintln(writer, render(styles.error, " · 현재 checkout보다 높은 버전"))
	}
	if result.ReceiptExcluded {
		fmt.Fprintln(writer, render(styles.muted, "  .nubo-market.json은 package에서 제외됩니다."))
	}
}

func printMarketPack(writer io.Writer, result marketPackResult, color bool) {
	styles := newPalette(color)
	fmt.Fprintln(writer)
	if result.Status == "current" {
		fmt.Fprintln(writer, render(styles.success, "✓ 같은 Market package가 이미 있습니다"))
	} else {
		fmt.Fprintln(writer, render(styles.success, "✓ Market package 생성 완료"))
	}
	fmt.Fprintf(writer, "  %s@%s · 파일 %d개 · %s\n", result.Coordinate, result.Version, result.Files, humanBytes(result.SizeBytes))
	fmt.Fprintf(writer, "  SHA-256 %s\n", result.PackageSHA256)
	fmt.Fprintf(writer, "  %s\n", result.PackagePath)
	fmt.Fprintln(writer, render(styles.muted, "  package를 업로드하거나 publish하지 않았습니다."))
}
