package main

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"
)

const (
	defaultMarketBaseURL   = "https://nubohub.org/market"
	maxMarketResponseBytes = 2 << 20
)

var (
	marketKeyPattern     = regexp.MustCompile(`^[a-z0-9_-]{3,80}$`)
	marketVersionPattern = regexp.MustCompile(`^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`)
	errMarketNotFound    = errors.New("market package not found")
)

type marketSkin struct {
	Key            string    `json:"key"`
	Name           string    `json:"name"`
	Version        string    `json:"version"`
	Author         string    `json:"author"`
	Website        string    `json:"website"`
	Description    string    `json:"description"`
	Preview        string    `json:"preview"`
	Screenshots    []string  `json:"screenshots,omitempty"`
	Features       []string  `json:"features"`
	MinNUBOVersion string    `json:"min_nubo_version"`
	SHA256         string    `json:"sha256"`
	SizeBytes      int64     `json:"size_bytes"`
	Downloads      int64     `json:"downloads"`
	PublishedAt    time.Time `json:"published_at"`
	DownloadURL    string    `json:"download_url"`
	PreviewURL     string    `json:"preview_url"`
	ScreenshotURLs []string  `json:"screenshot_urls,omitempty"`
	RatingAverage  float64   `json:"rating_average"`
	ReviewCount    int       `json:"review_count"`
	Coordinate     string    `json:"coordinate"`
	Compatible     bool      `json:"compatible"`
}

type marketSearchResponse struct {
	Items  []marketSkin `json:"items"`
	Total  int          `json:"total"`
	Limit  int          `json:"limit"`
	Offset int          `json:"offset"`
}

type marketSearchResult struct {
	Status      string       `json:"status"`
	Query       string       `json:"query"`
	NUBOVersion string       `json:"nuboVersion"`
	Items       []marketSkin `json:"items"`
	Total       int          `json:"total"`
	Limit       int          `json:"limit"`
	Offset      int          `json:"offset"`
}

type marketInfoResult struct {
	Status      string     `json:"status"`
	NUBOVersion string     `json:"nuboVersion"`
	Skin        marketSkin `json:"skin"`
}

type marketClient struct {
	baseURL string
	client  *http.Client
}

func newMarketClient(override string, client *http.Client) (*marketClient, error) {
	baseURL := strings.TrimRight(strings.TrimSpace(override), "/")
	if baseURL == "" {
		baseURL = defaultMarketBaseURL
	}
	parsed, err := url.Parse(baseURL)
	if err != nil || parsed == nil {
		return nil, errors.New("NUBO_MARKET_BASE_URL 값이 올바르지 않습니다")
	}
	localHTTP := parsed.Scheme == "http" && (parsed.Hostname() == "127.0.0.1" || parsed.Hostname() == "localhost" || parsed.Hostname() == "::1")
	if (parsed.Scheme != "https" && !localHTTP) || parsed.Host == "" || parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" {
		return nil, errors.New("NUBO_MARKET_BASE_URL은 HTTPS 주소여야 합니다")
	}
	if client == nil {
		client = &http.Client{Timeout: 15 * time.Second}
	}
	return &marketClient{baseURL: baseURL, client: client}, nil
}

func (client *marketClient) search(ctx context.Context, query string, limit, offset int) (marketSearchResponse, error) {
	values := url.Values{}
	if query != "" {
		values.Set("q", query)
	}
	values.Set("limit", strconv.Itoa(limit))
	values.Set("offset", strconv.Itoa(offset))
	var result marketSearchResponse
	if err := client.getJSON(ctx, "/v1/skins?"+values.Encode(), &result); err != nil {
		return result, err
	}
	if result.Total < 0 || result.Limit != limit || result.Offset != offset || len(result.Items) > limit {
		return result, errors.New("Market 검색 응답의 페이지 정보가 올바르지 않습니다")
	}
	for index := range result.Items {
		if err := validateMarketSkin(result.Items[index]); err != nil {
			return result, fmt.Errorf("Market 검색 응답이 올바르지 않습니다: %w", err)
		}
	}
	return result, nil
}

func (client *marketClient) info(ctx context.Context, key string) (marketSkin, error) {
	var result marketSkin
	if err := client.getJSON(ctx, "/v1/skins/"+url.PathEscape(key), &result); err != nil {
		return result, err
	}
	if err := validateMarketSkin(result); err != nil {
		return result, fmt.Errorf("Market 상세 응답이 올바르지 않습니다: %w", err)
	}
	if result.Key != key {
		return result, errors.New("Market 상세 응답의 package key가 요청과 다릅니다")
	}
	return result, nil
}

func (client *marketClient) getJSON(ctx context.Context, path string, destination any) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, client.baseURL+path, nil)
	if err != nil {
		return err
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("User-Agent", "nubo/"+version)
	response, err := client.client.Do(request)
	if err != nil {
		return fmt.Errorf("Market에 연결하지 못했습니다: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode == http.StatusNotFound {
		return errMarketNotFound
	}
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("Market 응답이 올바르지 않습니다: HTTP %d", response.StatusCode)
	}
	if response.ContentLength > maxMarketResponseBytes {
		return errors.New("Market 응답이 허용 크기를 초과합니다")
	}
	content, err := io.ReadAll(io.LimitReader(response.Body, maxMarketResponseBytes+1))
	if err != nil {
		return fmt.Errorf("Market JSON 응답을 읽을 수 없습니다: %w", err)
	}
	if len(content) > maxMarketResponseBytes {
		return errors.New("Market 응답이 허용 크기를 초과합니다")
	}
	decoder := json.NewDecoder(bytes.NewReader(content))
	if err := decoder.Decode(destination); err != nil {
		return fmt.Errorf("Market JSON 응답을 읽을 수 없습니다: %w", err)
	}
	var trailing any
	if err := decoder.Decode(&trailing); !errors.Is(err, io.EOF) {
		if err == nil {
			return errors.New("Market JSON 응답에 여러 값이 포함되어 있습니다")
		}
		return fmt.Errorf("Market JSON 응답을 끝까지 읽을 수 없습니다: %w", err)
	}
	return nil
}

func validateMarketSkin(item marketSkin) error {
	if !marketKeyPattern.MatchString(item.Key) {
		return errors.New("package key 형식이 올바르지 않습니다")
	}
	if !marketVersionPattern.MatchString(item.Version) || !marketVersionPattern.MatchString(item.MinNUBOVersion) {
		return errors.New("package version 형식이 올바르지 않습니다")
	}
	if item.Name == "" || item.Author == "" || item.Description == "" || item.Preview == "" || item.DownloadURL == "" || item.PreviewURL == "" {
		return errors.New("필수 package 정보가 없습니다")
	}
	if len(item.SHA256) != 64 {
		return errors.New("package SHA-256 형식이 올바르지 않습니다")
	}
	if _, err := hex.DecodeString(item.SHA256); err != nil {
		return errors.New("package SHA-256 형식이 올바르지 않습니다")
	}
	if item.SizeBytes < 1 || item.Downloads < 0 || item.ReviewCount < 0 || item.PublishedAt.IsZero() {
		return errors.New("package 수치 정보가 올바르지 않습니다")
	}
	return nil
}

func prepareMarketSkin(item marketSkin, nuboVersion string) marketSkin {
	item.Coordinate = "skins/" + item.Key
	item.Compatible = versionAtLeast(nuboVersion, item.MinNUBOVersion)
	return item
}

func parseSkinCoordinate(value string) (string, error) {
	prefix, key, found := strings.Cut(strings.TrimSpace(value), "/")
	if !found || prefix != "skins" || !marketKeyPattern.MatchString(key) {
		return "", errors.New("package 좌표는 skins/<key> 형식이어야 합니다")
	}
	return key, nil
}

func versionAtLeast(current, minimum string) bool {
	currentPrerelease := strings.Contains(strings.SplitN(current, "+", 2)[0], "-")
	current = strings.SplitN(current, "-", 2)[0]
	current = strings.SplitN(current, "+", 2)[0]
	minimum = strings.SplitN(minimum, "-", 2)[0]
	minimum = strings.SplitN(minimum, "+", 2)[0]
	var currentParts, minimumParts [3]int
	if _, err := fmt.Sscanf(current, "%d.%d.%d", &currentParts[0], &currentParts[1], &currentParts[2]); err != nil {
		return false
	}
	if _, err := fmt.Sscanf(minimum, "%d.%d.%d", &minimumParts[0], &minimumParts[1], &minimumParts[2]); err != nil {
		return false
	}
	for index := range currentParts {
		if currentParts[index] != minimumParts[index] {
			return currentParts[index] > minimumParts[index]
		}
	}
	return !currentPrerelease
}

func safeMarketText(value string) string {
	return strings.TrimSpace(strings.Map(func(character rune) rune {
		if unicode.IsControl(character) {
			return ' '
		}
		return character
	}, value))
}

func printMarketSearch(writer io.Writer, result marketSearchResult, color bool) {
	styles := newPalette(color)
	fmt.Fprintln(writer)
	fmt.Fprintf(writer, "%s  %d개", render(styles.heading, "NUBO Market"), result.Total)
	if result.Query != "" {
		fmt.Fprintf(writer, " · %q", safeMarketText(result.Query))
	}
	fmt.Fprintln(writer)
	if len(result.Items) == 0 {
		fmt.Fprintln(writer, render(styles.muted, "  검색 결과가 없습니다."))
		return
	}
	for _, item := range result.Items {
		compatibility := render(styles.success, "호환")
		if !item.Compatible {
			compatibility = render(styles.error, "NUBO 업데이트 필요")
		}
		fmt.Fprintf(writer, "\n  %s  %s\n", render(styles.key, item.Coordinate), safeMarketText(item.Name))
		fmt.Fprintf(writer, "    %s · NUBO >= %s · %s · %s\n", item.Version, item.MinNUBOVersion, humanBytes(item.SizeBytes), compatibility)
		fmt.Fprintf(writer, "    %s\n", safeMarketText(item.Description))
	}
	shown := result.Offset + len(result.Items)
	if shown < result.Total {
		fmt.Fprintf(writer, "\n%s\n", render(styles.muted, fmt.Sprintf("  %d/%d 표시 · 다음: --offset %d", shown, result.Total, shown)))
	}
}

func printMarketInfo(writer io.Writer, result marketInfoResult, color bool) {
	styles := newPalette(color)
	item := result.Skin
	compatibility := render(styles.success, "현재 checkout과 호환")
	if !item.Compatible {
		compatibility = render(styles.error, "NUBO 업데이트 필요")
	}
	fmt.Fprintln(writer)
	fmt.Fprintf(writer, "%s  %s\n", render(styles.heading, safeMarketText(item.Name)), render(styles.key, item.Coordinate))
	fmt.Fprintf(writer, "  %s · %s\n\n", item.Version, safeMarketText(item.Author))
	fmt.Fprintf(writer, "  %s\n\n", safeMarketText(item.Description))
	fmt.Fprintf(writer, "  최소 NUBO   %s (%s)\n", item.MinNUBOVersion, compatibility)
	fmt.Fprintf(writer, "  패키지 크기 %s\n", humanBytes(item.SizeBytes))
	fmt.Fprintf(writer, "  다운로드    %d\n", item.Downloads)
	fmt.Fprintf(writer, "  SHA-256     %s\n", strings.ToLower(item.SHA256))
	if len(item.Features) > 0 {
		features := make([]string, len(item.Features))
		for index := range item.Features {
			features[index] = safeMarketText(item.Features[index])
		}
		fmt.Fprintf(writer, "  기능        %s\n", strings.Join(features, " · "))
	}
	fmt.Fprintf(writer, "\n  설치: ./bin/nubo install %s\n", item.Coordinate)
}

func humanBytes(size int64) string {
	const unit = 1024
	if size < unit {
		return fmt.Sprintf("%d B", size)
	}
	divisor, exponent := int64(unit), 0
	for quotient := size / unit; quotient >= unit && exponent < 3; quotient /= unit {
		divisor *= unit
		exponent++
	}
	return fmt.Sprintf("%.1f %ciB", float64(size)/float64(divisor), "KMGT"[exponent])
}
