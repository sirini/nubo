package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const maxSkinPackageBytes = 20 << 20

func installSkin(ctx context.Context, client *http.Client, options skinRegistryOptions, output io.Writer) error {
	root, err := resolveSkinSource(options.source)
	if err != nil {
		return err
	}
	item, err := getRegistrySkin(ctx, client, options)
	if err != nil {
		return err
	}
	if err := validateRegistrySkin(item, options.key); err != nil {
		return err
	}
	if err := checkSkinCompatibility(root, item); err != nil {
		return err
	}
	skinsDir := filepath.Join(root, "app", "skins")
	if err := ensureSkinDestinationAvailable(skinsDir, item.Key); err != nil {
		return err
	}
	packagePath, err := downloadSkinPackage(ctx, client, skinsDir, item)
	if err != nil {
		return err
	}
	defer os.Remove(packagePath)
	if err := extractSkinPackage(packagePath, skinsDir, item); err != nil {
		return err
	}
	writeMarketInstall(output, item, filepath.Join(skinsDir, item.Key))
	return nil
}

func validateRegistrySkin(item registrySkin, requestedKey string) error {
	validIdentity := item.Key == requestedKey && skinKeyPattern.MatchString(item.Key)
	validVersions := skinVersionPattern.MatchString(item.Version) && skinVersionPattern.MatchString(item.MinNUBOVersion)
	if !validIdentity || !validVersions || item.SizeBytes < 0 {
		return fmt.Errorf("Registry가 올바르지 않은 스킨 메타데이터를 반환했습니다")
	}
	checksum, err := hex.DecodeString(item.SHA256)
	if err != nil || len(checksum) != sha256.Size {
		return fmt.Errorf("Registry가 올바르지 않은 checksum을 반환했습니다")
	}
	if !validHTTPURL(item.DownloadURL) {
		return fmt.Errorf("Registry가 올바르지 않은 다운로드 URL을 반환했습니다")
	}
	return nil
}

func checkSkinCompatibility(root string, item registrySkin) error {
	current, err := sourceNUBOVersion(root)
	if err != nil {
		return err
	}
	if versionLess(current, item.MinNUBOVersion) {
		return fmt.Errorf("%s에는 NUBO %s 이상이 필요합니다 (현재 %s)", item.Key, item.MinNUBOVersion, current)
	}
	return nil
}

func ensureSkinDestinationAvailable(skinsDir, key string) error {
	destination := filepath.Join(skinsDir, key)
	if _, err := os.Lstat(destination); err == nil {
		return fmt.Errorf("스킨이 이미 설치되어 있습니다: %s", destination)
	} else if !os.IsNotExist(err) {
		return err
	}
	return nil
}

// 다운로드 중 계산한 checksum만 신뢰하며, 서버가 보낸 ETag나 파일명은 설치 판단에 사용하지 않는다.
func downloadSkinPackage(ctx context.Context, client *http.Client, skinsDir string, item registrySkin) (string, error) {
	temp, err := os.CreateTemp(skinsDir, ".nubo-skin-*.tar.gz")
	if err != nil {
		return "", fmt.Errorf("임시 패키지를 만들 수 없습니다: %w", err)
	}
	filename := temp.Name()
	if err := writeSkinDownload(ctx, client, temp, item); err != nil {
		_ = temp.Close()
		_ = os.Remove(filename)
		return "", err
	}
	return filename, nil
}

func writeSkinDownload(ctx context.Context, client *http.Client, target *os.File, item registrySkin) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, item.DownloadURL, nil)
	if err != nil {
		return err
	}
	request.Header.Set("User-Agent", "nubo-market/"+marketVersion)
	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("스킨 패키지를 다운로드할 수 없습니다: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf("스킨 패키지 다운로드 실패: %s", response.Status)
	}
	hash := sha256.New()
	written, copyErr := io.Copy(io.MultiWriter(target, hash), io.LimitReader(response.Body, maxSkinPackageBytes+1))
	closeErr := target.Close()
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
