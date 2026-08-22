package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"
)

const defaultSkinRegistry = "https://nubohub.org/market"

var (
	skinKeyPattern     = regexp.MustCompile(`^[a-z0-9_-]{3,80}$`)
	skinVersionPattern = regexp.MustCompile(`^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`)
)

type registrySkin struct {
	Key            string   `json:"key"`
	Name           string   `json:"name"`
	Version        string   `json:"version"`
	Author         string   `json:"author"`
	Website        string   `json:"website"`
	Description    string   `json:"description"`
	Preview        string   `json:"preview"`
	Features       []string `json:"features"`
	MinNUBOVersion string   `json:"min_nubo_version"`
	SHA256         string   `json:"sha256"`
	SizeBytes      int64    `json:"size_bytes"`
	Downloads      int64    `json:"downloads"`
	DownloadURL    string   `json:"download_url"`
}

type registryList struct {
	Items []registrySkin `json:"items"`
	Total int            `json:"total"`
}

type registryError struct {
	Error string `json:"error"`
}
type skinRegistryOptions struct{ action, key, query, version, registry, source string }

// 공개 명령은 key 뒤에 옵션을 쓰는 자연스러운 순서와 일반적인 옵션 우선 순서를 모두 허용한다.
func parseSkinRegistryOptions(args []string) (skinRegistryOptions, error) {
	if len(args) == 0 {
		return skinRegistryOptions{}, fmt.Errorf("사용법: nuboctl market <search|info|install> [인자]")
	}
	options := skinRegistryOptions{action: args[0], registry: strings.TrimRight(os.Getenv("NUBO_MARKET_URL"), "/")}
	if options.registry == "" {
		options.registry = defaultSkinRegistry
	}
	positional, err := parseSkinFlags(args[1:], &options)
	if err != nil {
		return skinRegistryOptions{}, err
	}
	if err := validateSkinArguments(&options, positional); err != nil {
		return skinRegistryOptions{}, err
	}
	if !validHTTPURL(options.registry) {
		return skinRegistryOptions{}, fmt.Errorf("올바르지 않은 Registry URL입니다")
	}
	return options, nil
}

func parseSkinFlags(args []string, options *skinRegistryOptions) ([]string, error) {
	flags := flag.NewFlagSet("skin "+options.action, flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&options.registry, "registry", options.registry, "Skin Registry 기본 URL")
	flags.StringVar(&options.source, "source", "", "NUBO 소스 checkout 경로")
	flags.StringVar(&options.version, "version", "", "설치할 정확한 스킨 버전")
	leading := ""
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") {
		leading, args = args[0], args[1:]
	}
	if err := flags.Parse(args); err != nil {
		return nil, err
	}
	positional := flags.Args()
	if leading != "" {
		positional = append([]string{leading}, positional...)
	}
	options.registry = strings.TrimRight(options.registry, "/")
	return positional, nil
}

func validateSkinArguments(options *skinRegistryOptions, positional []string) error {
	switch options.action {
	case "search":
		if len(positional) > 1 {
			return fmt.Errorf("search 검색어는 하나만 입력할 수 있습니다")
		}
		if len(positional) == 1 {
			options.query = positional[0]
		}
	case "info", "install":
		if len(positional) != 1 {
			return fmt.Errorf("skin %s에는 스킨 key 하나가 필요합니다", options.action)
		}
		options.key = positional[0]
		if !skinKeyPattern.MatchString(options.key) {
			return fmt.Errorf("올바르지 않은 스킨 key입니다: %s", options.key)
		}
	default:
		return fmt.Errorf("지원하지 않는 skin 명령입니다: %s", options.action)
	}
	if options.action != "install" && options.version != "" {
		return fmt.Errorf("--version은 skin install에서만 사용할 수 있습니다")
	}
	return nil
}

func runSkinRegistry(args []string) error {
	options, err := parseSkinRegistryOptions(args)
	if err != nil {
		return err
	}
	client := &http.Client{Timeout: 45 * time.Second}
	switch options.action {
	case "search":
		return searchSkins(context.Background(), client, options, os.Stdout)
	case "info":
		return showSkin(context.Background(), client, options, os.Stdout)
	case "install":
		return installSkin(context.Background(), client, options, os.Stdout)
	}
	return nil
}

func searchSkins(ctx context.Context, client *http.Client, options skinRegistryOptions, output io.Writer) error {
	endpoint := options.registry + "/v1/skins?limit=100"
	if options.query != "" {
		endpoint += "&q=" + url.QueryEscape(options.query)
	}
	var list registryList
	if err := fetchRegistryJSON(ctx, client, endpoint, &list); err != nil {
		return err
	}
	if len(list.Items) == 0 {
		fmt.Fprintln(output, "검색 결과가 없습니다.")
		return nil
	}
	for _, item := range list.Items {
		fmt.Fprintf(output, "%-32s %-10s %s (NUBO >= %s)\n", item.Key, item.Version, item.Name, item.MinNUBOVersion)
	}
	fmt.Fprintf(output, "\n총 %d개\n", list.Total)
	return nil
}

func showSkin(ctx context.Context, client *http.Client, options skinRegistryOptions, output io.Writer) error {
	item, err := getRegistrySkin(ctx, client, options)
	if err != nil {
		return err
	}
	fmt.Fprintf(output, "%s (%s)\nkey: %s\nauthor: %s\nNUBO: %s 이상\ndownloads: %d\n%s\n", item.Name, item.Version, item.Key, item.Author, item.MinNUBOVersion, item.Downloads, item.Description)
	return nil
}

func validHTTPURL(value string) bool {
	parsed, err := url.Parse(value)
	return err == nil && (parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Host != ""
}
