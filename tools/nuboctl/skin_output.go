package main

import (
	"fmt"
	"io"
	"strings"
	"unicode"
)

func writeMarketEmpty(output io.Writer, query string) {
	writeMarketTitle(output, "SEARCH", query)
	fmt.Fprintln(output, "  검색 결과가 없습니다")
}

func writeMarketSearch(output io.Writer, list registryList, query string) {
	writeMarketTitle(output, "SEARCH", query)
	header := fmt.Sprintf("  %s  %-9s  %s  %s", marketCell("SKIN", 22), "VERSION", marketCell("NAME", 26), "REQUIRES")
	fmt.Fprintln(output, paint(output, ansiDim, header))
	fmt.Fprintln(output, paint(output, ansiDim, "  "+strings.Repeat("─", 74)))
	for _, item := range list.Items {
		key := paint(output, ansiBoldCyan, marketCell(item.Key, 22))
		version := paint(output, ansiGreen, fmt.Sprintf("%-9s", item.Version))
		fmt.Fprintf(output, "  %s  %s  %s  NUBO %s+\n", key, version, marketCell(item.Name, 26), item.MinNUBOVersion)
	}
	fmt.Fprintf(output, "\n  %s\n", paint(output, ansiBoldGreen, fmt.Sprintf("✓ 스킨 %d개", list.Total)))
}

func marketCell(value string, width int) string {
	cellWidth := 0
	var cell strings.Builder
	for _, character := range value {
		characterWidth := marketRuneWidth(character)
		if cellWidth+characterWidth > width {
			return trimMarketCell(cell.String(), width)
		}
		cell.WriteRune(character)
		cellWidth += characterWidth
	}
	return cell.String() + strings.Repeat(" ", width-cellWidth)
}

func trimMarketCell(value string, width int) string {
	target := width - 1
	cellWidth := 0
	var cell strings.Builder
	for _, character := range value {
		characterWidth := marketRuneWidth(character)
		if cellWidth+characterWidth > target {
			break
		}
		cell.WriteRune(character)
		cellWidth += characterWidth
	}
	trimmed := strings.TrimRightFunc(cell.String(), unicode.IsSpace)
	cellWidth = marketDisplayWidth(trimmed)
	return trimmed + "…" + strings.Repeat(" ", target-cellWidth)
}

func marketDisplayWidth(value string) int {
	width := 0
	for _, character := range value {
		width += marketRuneWidth(character)
	}
	return width
}

func marketRuneWidth(character rune) int {
	if unicode.Is(unicode.Mn, character) || unicode.Is(unicode.Me, character) || unicode.Is(unicode.Cf, character) {
		return 0
	}
	if unicode.In(character, unicode.Hangul, unicode.Han, unicode.Hiragana, unicode.Katakana, unicode.Bopomofo) {
		return 2
	}
	return 1
}

func writeMarketInfo(output io.Writer, item registrySkin) {
	writeMarketTitle(output, "SKIN", item.Key)
	writeMarketField(output, "NAME", item.Name)
	writeMarketField(output, "VERSION", paint(output, ansiGreen, item.Version))
	writeMarketField(output, "AUTHOR", item.Author)
	writeMarketField(output, "REQUIRES", "NUBO "+item.MinNUBOVersion+"+")
	writeMarketField(output, "DOWNLOADS", fmt.Sprintf("%d", item.Downloads))
	if len(item.Features) > 0 {
		writeMarketField(output, "FEATURES", strings.Join(item.Features, " · "))
	}
	fmt.Fprintf(output, "\n  %s\n  %s\n", paint(output, ansiDim, "DESCRIPTION"), item.Description)
}

func writeMarketInstall(output io.Writer, item registrySkin, destination string) {
	writeMarketTitle(output, "INSTALL COMPLETE", item.Key)
	writeMarketField(output, "VERSION", paint(output, ansiGreen, item.Version))
	writeMarketField(output, "LOCATION", destination)
	writeMarketField(output, "VERIFIED", paint(output, ansiBoldGreen, "SHA-256 checksum"))
	writeMarketField(output, "TRACKED", "안전한 변경 확인용 파일 영수증")
	writeMarketBuildNext(output)
}

func writeMarketRemovePlan(output io.Writer, removal skinRemoval, dryRun bool) {
	action := "REMOVE"
	if dryRun {
		action = "REMOVE PREVIEW"
	}
	writeMarketTitle(output, action, removal.key)
	writeMarketField(output, "VERSION", removal.version)
	writeMarketField(output, "LOCATION", removal.destination)
	writeMarketField(output, "FILES", fmt.Sprintf("%d개", removal.files))
	writeMarketField(output, "VERIFIED", paint(output, ansiBoldGreen, "설치 뒤 변경 없음"))
	if dryRun {
		fmt.Fprintf(output, "\n  %s  실제 파일은 삭제하지 않았습니다\n", paint(output, ansiDim, "DRY RUN"))
	}
}

func writeMarketRemoveComplete(output io.Writer, removal skinRemoval) {
	fmt.Fprintf(output, "\n  %s\n", paint(output, ansiBoldGreen, "✓ 스킨 소스 삭제 완료"))
	writeMarketBuildNext(output)
}

func writeMarketDiff(output io.Writer, receipt skinReceipt, destination string, issues []string) {
	action := "UNCHANGED"
	if len(issues) > 0 {
		action = "LOCAL CHANGES"
	}
	writeMarketTitle(output, action, receipt.Key)
	writeMarketField(output, "VERSION", receipt.Version)
	writeMarketField(output, "LOCATION", destination)
	if len(issues) == 0 {
		writeMarketField(output, "STATUS", paint(output, ansiBoldGreen, "설치 뒤 변경 없음"))
		return
	}
	for _, issue := range issues {
		fmt.Fprintf(output, "  - %s\n", issue)
	}
}

func writeMarketUpToDate(output io.Writer, receipt skinReceipt) {
	writeMarketTitle(output, "UP TO DATE", receipt.Key)
	writeMarketField(output, "VERSION", receipt.Version)
}

func writeMarketUpdatePlan(output io.Writer, change skinUpdate, dryRun bool) {
	action := "UPDATE"
	if dryRun {
		action = "UPDATE PREVIEW"
	}
	writeMarketTitle(output, action, change.key)
	writeMarketField(output, "VERSION", change.fromVersion+" → "+change.toVersion)
	writeMarketField(output, "LOCATION", change.destination)
	writeMarketField(output, "VERIFIED", paint(output, ansiBoldGreen, "현재 파일 및 새 패키지"))
	if dryRun {
		fmt.Fprintf(output, "\n  %s  실제 파일은 바꾸지 않았습니다\n", paint(output, ansiDim, "DRY RUN"))
	}
}

func writeMarketUpdateComplete(output io.Writer, change skinUpdate) {
	fmt.Fprintf(output, "\n  %s\n", paint(output, ansiBoldGreen, "✓ UPDATE COMPLETE"))
	writeMarketBuildNext(output)
}

func writeMarketFork(output io.Writer, fork skinFork) {
	writeMarketTitle(output, "FORK COMPLETE", fork.toKey)
	writeMarketField(output, "DERIVED", fork.fromKey+"@"+fork.fromVersion)
	writeMarketField(output, "LOCATION", fork.destination)
	writeMarketField(output, "OWNERSHIP", "사이트 소유 스킨 · Market 영수증 없음")
	writeMarketBuildNext(output)
}

func writeMarketBuildNext(output io.Writer) {
	fmt.Fprintf(output, "\n  %s  %s\n", paint(output, ansiDim, "NEXT"), paint(output, ansiBoldCyan, "npm run build"))
	fmt.Fprintln(output, "        빌드가 끝나면 운영 중인 Node·PM2·systemd·tmux 프로세스를 직접 재시작하세요.")
}

func writeMarketTitle(output io.Writer, action, subject string) {
	title := "◆ NUBO MARKET · " + action
	if subject != "" {
		title += " · " + subject
	}
	fmt.Fprintf(output, "\n%s\n\n", paint(output, ansiBoldCyan, title))
}

func writeMarketField(output io.Writer, label, value string) {
	fmt.Fprintf(output, "  %s  %s\n", paint(output, ansiDim, fmt.Sprintf("%-10s", label)), value)
}
