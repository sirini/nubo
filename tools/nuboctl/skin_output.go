package main

import (
	"fmt"
	"io"
	"strings"
)

func writeMarketEmpty(output io.Writer, query string) {
	writeMarketTitle(output, "SEARCH", query)
	fmt.Fprintln(output, "  검색 결과가 없습니다")
}

func writeMarketSearch(output io.Writer, list registryList, query string) {
	writeMarketTitle(output, "SEARCH", query)
	header := fmt.Sprintf("  %-31s  %-9s  %-22s  %s", "SKIN", "VERSION", "NAME", "REQUIRES")
	fmt.Fprintln(output, paint(output, ansiDim, header))
	fmt.Fprintln(output, paint(output, ansiDim, "  ─────────────────────────────────────────────────────────────────────────────"))
	for _, item := range list.Items {
		key := paint(output, ansiBoldCyan, fmt.Sprintf("%-31s", item.Key))
		version := paint(output, ansiGreen, fmt.Sprintf("%-9s", item.Version))
		fmt.Fprintf(output, "  %s  %s  %-22s  NUBO %s+\n", key, version, item.Name, item.MinNUBOVersion)
	}
	fmt.Fprintf(output, "\n  %s\n", paint(output, ansiBoldGreen, fmt.Sprintf("✓ 스킨 %d개", list.Total)))
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
	fmt.Fprintf(output, "\n  %s  %s\n", paint(output, ansiDim, "NEXT"), paint(output, ansiBoldCyan, "nuboctl customize"))
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
