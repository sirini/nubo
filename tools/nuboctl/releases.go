package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"
)

type releasesOptions struct {
	action       string
	releasesDir  string
	currentLink  string
	previousLink string
	keep         int
	dryRun       bool
}

type installedRelease struct {
	name       string
	path       string
	version    string
	siteBuild  *siteBuildManifest
	modifiedAt time.Time
	size       int64
	reason     string
	valid      bool
}

// 릴리스 목록과 정리 명령을 분리해, 인자 없는 실행은 파괴 없이 도움말만 보여준다.
func runReleasesCommand(args []string) int {
	if len(args) == 0 {
		printHelp("releases")
		return 0
	}
	options, err := parseReleasesOptions(args)
	if err != nil {
		return commandOptionError(err)
	}
	if options.action == "list" {
		entries, err := planInstalledReleases(options, false)
		if err != nil {
			printFailure("릴리스 목록 확인 실패: %v", err)
			return 1
		}
		printReleaseList(entries)
		return 0
	}
	if err := pruneInstalledReleases(options, true); err != nil {
		printFailure("릴리스 정리 실패: %v", err)
		return 1
	}
	return 0
}

func parseReleasesOptions(args []string) (releasesOptions, error) {
	options := releasesOptions{
		action: args[0], releasesDir: "/opt/nubo/releases", currentLink: "/opt/nubo/current",
		previousLink: "/opt/nubo/previous", keep: 1,
	}
	if options.action != "list" && options.action != "prune" {
		return releasesOptions{}, fmt.Errorf("사용법: nuboctl releases <list|prune> [옵션]")
	}
	flags := flag.NewFlagSet("releases "+options.action, flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&options.releasesDir, "releases", options.releasesDir, "릴리스 보관 디렉터리")
	flags.StringVar(&options.currentLink, "current", options.currentLink, "현재 릴리스 링크")
	flags.StringVar(&options.previousLink, "previous", options.previousLink, "직전 릴리스 링크")
	if options.action == "prune" {
		flags.IntVar(&options.keep, "keep", options.keep, "보호 대상 외에 보존할 최신 예비 릴리스 수")
		flags.BoolVar(&options.dryRun, "dry-run", false, "삭제 대상을 검증하되 파일은 유지")
	}
	if err := flags.Parse(args[1:]); err != nil {
		return releasesOptions{}, err
	}
	if flags.NArg() != 0 {
		return releasesOptions{}, fmt.Errorf("예상하지 못한 인자: %s", flags.Arg(0))
	}
	if options.keep < 0 {
		return releasesOptions{}, fmt.Errorf("--keep은 0 이상이어야 합니다")
	}
	for _, path := range []*string{&options.releasesDir, &options.currentLink, &options.previousLink} {
		absolute, err := filepath.Abs(*path)
		if err != nil {
			return releasesOptions{}, err
		}
		*path = absolute
	}
	return options, nil
}

// 보호 이유까지 계산한 목록을 만들며, 정리 계획에서는 삭제 후보의 전체 checksum도 검증한다.
func planInstalledReleases(options releasesOptions, verifyCandidates bool) ([]installedRelease, error) {
	rootInfo, err := os.Lstat(options.releasesDir)
	if err != nil || !rootInfo.IsDir() || rootInfo.Mode()&os.ModeSymlink != 0 {
		return nil, fmt.Errorf("releases 경로는 실제 디렉터리여야 합니다: %s", options.releasesDir)
	}
	root, err := filepath.EvalSymlinks(options.releasesDir)
	if err != nil {
		return nil, err
	}
	current, err := releaseLinkTarget(options.currentLink, root, true)
	if err != nil {
		return nil, err
	}
	previous, err := releaseLinkTarget(options.previousLink, root, false)
	if err != nil {
		return nil, err
	}

	directoryEntries, err := os.ReadDir(root)
	if err != nil {
		return nil, err
	}
	entries := make([]installedRelease, 0, len(directoryEntries))
	for _, directoryEntry := range directoryEntries {
		if directoryEntry.Type()&os.ModeSymlink != 0 {
			continue
		}
		info, infoErr := directoryEntry.Info()
		if infoErr != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			continue
		}
		path := filepath.Join(root, directoryEntry.Name())
		manifest, manifestErr := readManifest(path)
		size, sizeErr := releaseDirectorySize(path)
		if sizeErr != nil {
			return nil, fmt.Errorf("%s 크기 확인 실패: %w", directoryEntry.Name(), sizeErr)
		}
		entry := installedRelease{name: directoryEntry.Name(), path: path, modifiedAt: info.ModTime(), size: size}
		if manifestErr == nil {
			entry.valid = true
			entry.version = manifest.ReleaseVersion
			entry.siteBuild = manifest.SiteBuild
		} else {
			entry.reason = "manifest를 인식할 수 없어 보존"
		}
		entries = append(entries, entry)
	}

	currentIndex := releaseEntryIndex(entries, current)
	if currentIndex < 0 || !entries[currentIndex].valid {
		return nil, fmt.Errorf("현재 릴리스의 manifest를 확인할 수 없습니다: %s", current)
	}
	entries[currentIndex].reason = "현재 활성 릴리스"
	if previous != "" {
		index := releaseEntryIndex(entries, previous)
		if index < 0 {
			return nil, fmt.Errorf("직전 릴리스를 보관함에서 찾을 수 없습니다: %s", previous)
		}
		if index == currentIndex {
			entries[index].reason = "현재·직전 활성 릴리스"
		} else {
			entries[index].reason = "직전 활성 릴리스"
		}
	}
	if site := entries[currentIndex].siteBuild; site != nil {
		for index := range entries {
			if entries[index].valid && entries[index].siteBuild == nil && entries[index].version == site.BaseVersion && entries[index].reason == "" {
				entries[index].reason = "현재 커스텀 빌드의 공식 기반"
			}
		}
	}

	if verifyCandidates {
		for index := range entries {
			if entries[index].valid && entries[index].reason == "" {
				if err := validateInstallRelease(entries[index].path); err != nil {
					entries[index].reason = "무결성 검증 실패로 보존"
				} else if err := verifyReleaseDeletionInventory(entries[index].path); err != nil {
					entries[index].reason = "추가 파일 또는 외부 링크가 있어 보존"
				}
			}
		}
	}
	spares := make([]int, 0, len(entries))
	for index := range entries {
		if entries[index].valid && entries[index].reason == "" {
			spares = append(spares, index)
		}
	}
	sort.Slice(spares, func(left, right int) bool {
		if entries[spares[left]].modifiedAt.Equal(entries[spares[right]].modifiedAt) {
			return entries[spares[left]].name > entries[spares[right]].name
		}
		return entries[spares[left]].modifiedAt.After(entries[spares[right]].modifiedAt)
	})
	for _, index := range spares[:min(options.keep, len(spares))] {
		entries[index].reason = "최신 예비 릴리스"
	}
	sort.Slice(entries, func(left, right int) bool {
		if entries[left].modifiedAt.Equal(entries[right].modifiedAt) {
			return entries[left].name > entries[right].name
		}
		return entries[left].modifiedAt.After(entries[right].modifiedAt)
	})
	return entries, nil
}

func releaseLinkTarget(linkPath, releasesRoot string, required bool) (string, error) {
	info, err := os.Lstat(linkPath)
	if os.IsNotExist(err) && !required {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	if info.Mode()&os.ModeSymlink == 0 {
		return "", fmt.Errorf("릴리스 링크가 심볼릭 링크가 아닙니다: %s", linkPath)
	}
	target, err := filepath.EvalSymlinks(linkPath)
	if err != nil {
		return "", fmt.Errorf("릴리스 링크 확인 실패: %w", err)
	}
	if filepath.Dir(target) != releasesRoot || target == releasesRoot {
		return "", fmt.Errorf("릴리스 링크가 보관 디렉터리의 직접 하위를 가리키지 않습니다: %s", linkPath)
	}
	return target, nil
}

func releaseEntryIndex(entries []installedRelease, path string) int {
	for index := range entries {
		if entries[index].path == path {
			return index
		}
	}
	return -1
}

func releaseDirectorySize(root string) (int64, error) {
	var size int64
	err := filepath.WalkDir(root, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if info.Mode().IsRegular() {
			size += info.Size()
		}
		return nil
	})
	return size, err
}

func pruneInstalledReleases(options releasesOptions, requireRoot bool) error {
	if requireRoot && !options.dryRun && currentEUID() != 0 {
		return fmt.Errorf("실제 릴리스 정리는 root 권한이 필요합니다; 먼저 --dry-run으로 확인하세요")
	}
	var lock *updateLock
	var err error
	if !options.dryRun {
		lock, err = acquireUpdateLock(options.currentLink)
		if err != nil {
			return err
		}
		defer lock.close()
	}
	entries, err := planInstalledReleases(options, true)
	if err != nil {
		return err
	}
	printReleasePrunePlan(entries)
	if options.dryRun {
		printSuccess("미리보기가 끝났습니다. 릴리스 파일은 삭제하지 않았습니다.")
		return nil
	}
	deleted := 0
	var reclaimed int64
	for _, entry := range entries {
		if entry.reason != "" {
			continue
		}
		if err := removeInstalledRelease(entry, options); err != nil {
			return err
		}
		deleted++
		reclaimed += entry.size
	}
	printSuccess("릴리스 정리 완료: %d개 삭제 · %s 확보", deleted, formatReleaseBytes(reclaimed))
	return nil
}

func removeInstalledRelease(entry installedRelease, options releasesOptions) error {
	root, err := filepath.EvalSymlinks(options.releasesDir)
	if err != nil || filepath.Dir(entry.path) != root {
		return fmt.Errorf("삭제 경계가 달라졌습니다: %s", entry.path)
	}
	info, err := os.Lstat(entry.path)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("삭제 대상이 실제 릴리스 디렉터리가 아닙니다: %s", entry.path)
	}
	for _, link := range []struct {
		path     string
		required bool
	}{{options.currentLink, true}, {options.previousLink, false}} {
		target, linkErr := releaseLinkTarget(link.path, root, link.required)
		if linkErr != nil {
			return linkErr
		}
		if target == entry.path {
			return fmt.Errorf("보호 링크가 가리키는 릴리스는 삭제할 수 없습니다: %s", entry.name)
		}
	}
	if err := validateInstallRelease(entry.path); err != nil {
		return fmt.Errorf("삭제 직전 무결성 검증 실패로 보존합니다: %s: %w", entry.name, err)
	}
	if err := verifyReleaseDeletionInventory(entry.path); err != nil {
		return fmt.Errorf("삭제 대상에 추가 파일 또는 외부 링크가 있어 보존합니다: %s: %w", entry.name, err)
	}
	if err := os.RemoveAll(entry.path); err != nil {
		return fmt.Errorf("%s 삭제 실패: %w", entry.name, err)
	}
	return nil
}

// checksum에 없는 운영자 파일이나 외부 링크를 발견하면 디렉터리 전체 삭제를 거부한다.
func verifyReleaseDeletionInventory(releaseDir string) error {
	checksums, err := readReleaseChecksums(releaseDir)
	if err != nil {
		return err
	}
	tracked := make(map[string]bool, len(checksums))
	for _, checksum := range checksums {
		tracked[checksum.relative] = true
	}
	return filepath.WalkDir(releaseDir, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		relative, err := filepath.Rel(releaseDir, path)
		if err != nil || relative == "." || entry.IsDir() {
			return err
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return ensureResolvedInside(releaseDir, path)
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if info.Mode().IsRegular() {
			if relative != "checksums.txt" && !tracked[relative] {
				return fmt.Errorf("checksum에 없는 파일: %s", relative)
			}
			return nil
		}
		return fmt.Errorf("지원하지 않는 파일 형식: %s", relative)
	})
}

func printReleaseList(entries []installedRelease) {
	printHeading("설치된 릴리스  %d개", len(entries))
	for _, entry := range entries {
		state := entry.reason
		if state == "" {
			state = "보호되지 않음"
		}
		version := entry.version
		if version == "" {
			version = "알 수 없음"
		}
		printItem(state, "%s · NUBO %s · %s", entry.name, version, formatReleaseBytes(entry.size))
	}
}

func printReleasePrunePlan(entries []installedRelease) {
	var candidates int
	var reclaimed int64
	for _, entry := range entries {
		if entry.reason == "" {
			candidates++
			reclaimed += entry.size
		}
	}
	printHeading("릴리스 정리 계획")
	for _, entry := range entries {
		if entry.reason == "" {
			printItem("삭제", "%s · NUBO %s · %s", entry.name, entry.version, formatReleaseBytes(entry.size))
		}
	}
	if candidates == 0 {
		printItem("삭제", "대상 없음")
	}
	printItem("보존", "%d개", len(entries)-candidates)
	printItem("예상 확보", "%s", formatReleaseBytes(reclaimed))
}

func formatReleaseBytes(size int64) string {
	const unit = int64(1024)
	if size < unit {
		return fmt.Sprintf("%d B", size)
	}
	value := float64(size)
	units := []string{"KiB", "MiB", "GiB", "TiB"}
	for _, label := range units {
		value /= 1024
		if value < 1024 || label == units[len(units)-1] {
			return fmt.Sprintf("%.1f %s", value, label)
		}
	}
	return fmt.Sprintf("%d B", size)
}
