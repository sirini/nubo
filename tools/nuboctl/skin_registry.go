package main

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

const (
	defaultSkinRegistry  = "https://nubohub.org/market"
	maxSkinPackageBytes  = 20 << 20
	maxSkinFiles         = 1000
	maxSkinExpandedBytes = 100 << 20
)

var (
	skinKeyPattern = regexp.MustCompile(`^[a-z0-9_-]{3,80}$`)
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

func parseSkinRegistryOptions(args []string) (skinRegistryOptions, error) {
	if len(args) == 0 {
		return skinRegistryOptions{}, fmt.Errorf("사용법: nuboctl skin <search|info|install> [인자]")
	}
	options := skinRegistryOptions{action: args[0], registry: strings.TrimRight(os.Getenv("NUBO_MARKET_URL"), "/")}
	if options.registry == "" {
		options.registry = defaultSkinRegistry
	}
	flags := flag.NewFlagSet("skin "+options.action, flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&options.registry, "registry", options.registry, "Skin Registry 기본 URL")
	flags.StringVar(&options.source, "source", "", "NUBO 소스 checkout 경로")
	flags.StringVar(&options.version, "version", "", "설치할 정확한 스킨 버전")
	flagArgs := args[1:]
	leading := ""
	if len(flagArgs) > 0 && !strings.HasPrefix(flagArgs[0], "-") {
		leading = flagArgs[0]
		flagArgs = flagArgs[1:]
	}
	if err := flags.Parse(flagArgs); err != nil {
		return skinRegistryOptions{}, err
	}
	positional := flags.Args()
	if leading != "" {
		positional = append([]string{leading}, positional...)
	}
	switch options.action {
	case "search":
		if len(positional) > 1 {
			return skinRegistryOptions{}, fmt.Errorf("search 검색어는 하나만 입력할 수 있습니다")
		}
		if len(positional) == 1 {
			options.query = positional[0]
		}
	case "info", "install":
		if len(positional) != 1 {
			return skinRegistryOptions{}, fmt.Errorf("skin %s에는 스킨 key 하나가 필요합니다", options.action)
		}
		options.key = positional[0]
		if !skinKeyPattern.MatchString(options.key) {
			return skinRegistryOptions{}, fmt.Errorf("올바르지 않은 스킨 key입니다: %s", options.key)
		}
	default:
		return skinRegistryOptions{}, fmt.Errorf("지원하지 않는 skin 명령입니다: %s", options.action)
	}
	if options.action != "install" && options.version != "" {
		return skinRegistryOptions{}, fmt.Errorf("--version은 skin install에서만 사용할 수 있습니다")
	}
	options.registry = strings.TrimRight(options.registry, "/")
	parsed, err := url.Parse(options.registry)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return skinRegistryOptions{}, fmt.Errorf("올바르지 않은 Registry URL입니다")
	}
	return options, nil
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
	printSkin(output, item)
	return nil
}

func printSkin(output io.Writer, item registrySkin) {
	fmt.Fprintf(output, "%s (%s)\nkey: %s\nauthor: %s\nNUBO: %s 이상\ndownloads: %d\n%s\n", item.Name, item.Version, item.Key, item.Author, item.MinNUBOVersion, item.Downloads, item.Description)
}

func getRegistrySkin(ctx context.Context, client *http.Client, options skinRegistryOptions) (registrySkin, error) {
	endpoint := options.registry + "/v1/skins/" + url.PathEscape(options.key)
	if options.version != "" {
		endpoint += "/versions/" + url.PathEscape(options.version)
	}
	var item registrySkin
	err := fetchRegistryJSON(ctx, client, endpoint, &item)
	return item, err
}

func fetchRegistryJSON(ctx context.Context, client *http.Client, endpoint string, target any) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	request.Header.Set("User-Agent", "nuboctl/"+version)
	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("NUBO Market에 연결할 수 없습니다: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		var failure registryError
		_ = json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&failure)
		if failure.Error == "" {
			failure.Error = response.Status
		}
		return fmt.Errorf("NUBO Market 요청 실패: %s", failure.Error)
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 2<<20)).Decode(target); err != nil {
		return fmt.Errorf("NUBO Market 응답을 읽을 수 없습니다: %w", err)
	}
	return nil
}

func installSkin(ctx context.Context, client *http.Client, options skinRegistryOptions, output io.Writer) error {
	root, err := resolveSkinSource(options.source)
	if err != nil {
		return err
	}
	item, err := getRegistrySkin(ctx, client, options)
	if err != nil {
		return err
	}
	if item.Key != options.key || !skinKeyPattern.MatchString(item.Key) || !skinVersionPattern.MatchString(item.Version) || !skinVersionPattern.MatchString(item.MinNUBOVersion) || item.SizeBytes < 0 {
		return fmt.Errorf("Registry가 올바르지 않은 스킨 메타데이터를 반환했습니다")
	}
	if decoded, decodeErr := hex.DecodeString(item.SHA256); decodeErr != nil || len(decoded) != sha256.Size { return fmt.Errorf("Registry가 올바르지 않은 checksum을 반환했습니다") }
	downloadURL, parseErr := url.Parse(item.DownloadURL)
	if parseErr != nil || (downloadURL.Scheme != "http" && downloadURL.Scheme != "https") || downloadURL.Host == "" { return fmt.Errorf("Registry가 올바르지 않은 다운로드 URL을 반환했습니다") }
	current, err := sourceNUBOVersion(root)
	if err != nil {
		return err
	}
	if versionLess(current, item.MinNUBOVersion) {
		return fmt.Errorf("%s에는 NUBO %s 이상이 필요합니다 (현재 %s)", item.Key, item.MinNUBOVersion, current)
	}
	skinsDir := filepath.Join(root, "app", "skins")
	destination := filepath.Join(skinsDir, item.Key)
	if _, err = os.Lstat(destination); err == nil {
		return fmt.Errorf("스킨이 이미 설치되어 있습니다: %s", destination)
	} else if !os.IsNotExist(err) {
		return err
	}
	temp, err := os.CreateTemp(skinsDir, ".nubo-skin-*.tar.gz")
	if err != nil {
		return fmt.Errorf("임시 패키지를 만들 수 없습니다: %w", err)
	}
	packagePath := temp.Name()
	defer os.Remove(packagePath)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, item.DownloadURL, nil)
	if err != nil {
		temp.Close()
		return err
	}
	request.Header.Set("User-Agent", "nuboctl/"+version)
	response, err := client.Do(request)
	if err != nil {
		temp.Close()
		return fmt.Errorf("스킨 패키지를 다운로드할 수 없습니다: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		temp.Close()
		return fmt.Errorf("스킨 패키지 다운로드 실패: %s", response.Status)
	}
	hash := sha256.New()
	written, copyErr := io.Copy(io.MultiWriter(temp, hash), io.LimitReader(response.Body, maxSkinPackageBytes+1))
	closeErr := temp.Close()
	if copyErr != nil || closeErr != nil {
		return fmt.Errorf("스킨 패키지를 저장할 수 없습니다")
	}
	if written > maxSkinPackageBytes || item.SizeBytes > maxSkinPackageBytes {
		return fmt.Errorf("스킨 패키지가 허용 크기를 초과했습니다")
	}
	actual := hex.EncodeToString(hash.Sum(nil))
	if !strings.EqualFold(actual, item.SHA256) {
		return fmt.Errorf("스킨 패키지 checksum이 다릅니다: expected %s, got %s", item.SHA256, actual)
	}
	if err := extractSkinPackage(packagePath, skinsDir, item); err != nil {
		return err
	}
	fmt.Fprintf(output, "스킨 설치 완료: %s %s\n", item.Key, item.Version)
	fmt.Fprintln(output, "사이트에 반영하려면 이 checkout에서 nuboctl customize를 실행하세요.")
	return nil
}

func resolveSkinSource(value string) (string, error) {
	if value == "" {
		value = os.Getenv("NUBO_SOURCE_DIR")
	}
	if value == "" {
		current, err := os.Getwd()
		if err != nil {
			return "", err
		}
		value = current
	}
	root, err := filepath.Abs(value)
	if err != nil {
		return "", err
	}
	for _, required := range []string{"package.json", filepath.Join("app", "skins")} {
		info, statErr := os.Stat(filepath.Join(root, required))
		if statErr != nil || (required == "package.json" && !info.Mode().IsRegular()) || (required != "package.json" && !info.IsDir()) {
			return "", fmt.Errorf("NUBO 프로젝트 폴더를 찾을 수 없습니다: %s", root)
		}
	}
	return root, nil
}

func sourceNUBOVersion(root string) (string, error) {
	contents, err := os.ReadFile(filepath.Join(root, "deploy", "release-sources.json"))
	if err != nil {
		return "", fmt.Errorf("NUBO 버전을 확인할 수 없습니다: %w", err)
	}
	var sources struct {
		Channel struct {
			Version string `json:"version"`
		} `json:"channel"`
	}
	if err = json.Unmarshal(contents, &sources); err != nil || sources.Channel.Version == "" {
		return "", fmt.Errorf("deploy/release-sources.json의 NUBO 버전이 올바르지 않습니다")
	}
	return sources.Channel.Version, nil
}

func versionLess(left, right string) bool {
	var l1, l2, l3, r1, r2, r3 int
	if _, err := fmt.Sscanf(strings.TrimPrefix(left, "v"), "%d.%d.%d", &l1, &l2, &l3); err != nil {
		return true
	}
	if _, err := fmt.Sscanf(strings.TrimPrefix(right, "v"), "%d.%d.%d", &r1, &r2, &r3); err != nil {
		return true
	}
	if l1 != r1 {
		return l1 < r1
	}
	if l2 != r2 {
		return l2 < r2
	}
	return l3 < r3
}

func extractSkinPackage(filename, skinsDir string, item registrySkin) error {
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	gz, err := gzip.NewReader(file)
	if err != nil {
		return fmt.Errorf("스킨 패키지가 gzip 형식이 아닙니다: %w", err)
	}
	defer gz.Close()
	reader := tar.NewReader(gz)
	temporary, err := os.MkdirTemp(skinsDir, ".nubo-skin-install-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(temporary)
	files := 0
	var expanded int64
	manifestFound := false
	for {
		header, nextErr := reader.Next()
		if nextErr == io.EOF {
			break
		}
		if nextErr != nil {
			return fmt.Errorf("스킨 패키지가 손상되었습니다: %w", nextErr)
		}
		files++
		if files > maxSkinFiles {
			return fmt.Errorf("스킨 패키지 파일 수가 너무 많습니다")
		}
		name := strings.TrimSuffix(header.Name, "/")
		clean := path.Clean(name)
		if name == "" || clean != name || path.IsAbs(name) || strings.Contains(name, "\\") || clean == ".." || strings.HasPrefix(clean, "../") {
			return fmt.Errorf("안전하지 않은 스킨 경로입니다: %s", header.Name)
		}
		parts := strings.Split(clean, "/")
		if parts[0] != item.Key {
			return fmt.Errorf("패키지 폴더와 스킨 key가 다릅니다")
		}
		target := filepath.Join(temporary, filepath.FromSlash(clean))
		relative, relErr := filepath.Rel(temporary, target)
		if relErr != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(os.PathSeparator)) {
			return fmt.Errorf("스킨 경로가 설치 폴더를 벗어납니다")
		}
		switch header.Typeflag {
		case tar.TypeDir:
			if err = os.MkdirAll(target, 0755); err != nil {
				return err
			}
		case tar.TypeReg, tar.TypeRegA:
			expanded += header.Size
			if header.Size < 0 || expanded > maxSkinExpandedBytes {
				return fmt.Errorf("압축 해제 크기가 허용 범위를 초과했습니다")
			}
			if err = os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return err
			}
			output, createErr := os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
			if createErr != nil {
				return createErr
			}
			copied, copyErr := io.Copy(output, io.LimitReader(reader, header.Size))
			closeErr := output.Close()
			if copyErr != nil || closeErr != nil || copied != header.Size {
				return fmt.Errorf("스킨 파일을 쓸 수 없습니다")
			}
			if clean == item.Key+"/skin.json" {
				var manifest registrySkin
				contents, readErr := os.ReadFile(target)
				if readErr != nil {
					return readErr
				}
				if json.Unmarshal(contents, &manifest) != nil || manifest.Key != item.Key || manifest.Version != item.Version {
					return fmt.Errorf("패키지 manifest와 Registry 메타데이터가 다릅니다")
				}
				manifestFound = true
			}
		default:
			return fmt.Errorf("스킨 패키지의 링크나 특수 파일은 허용하지 않습니다")
		}
	}
	if !manifestFound {
		return fmt.Errorf("스킨 패키지에 skin.json이 없습니다")
	}
	return os.Rename(filepath.Join(temporary, item.Key), filepath.Join(skinsDir, item.Key))
}
