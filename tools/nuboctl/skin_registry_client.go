package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

func getRegistrySkin(ctx context.Context, client *http.Client, options skinRegistryOptions) (registrySkin, error) {
	endpoint := options.registry + "/v1/skins/" + url.PathEscape(options.key)
	if options.version != "" {
		endpoint += "/versions/" + url.PathEscape(options.version)
	}
	var item registrySkin
	err := fetchRegistryJSON(ctx, client, endpoint, &item)
	return item, err
}

// 응답 크기를 제한해 잘못된 Registry가 CLI 메모리를 과도하게 사용하지 못하게 한다.
func fetchRegistryJSON(ctx context.Context, client *http.Client, endpoint string, target any) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	request.Header.Set("User-Agent", "nubo-market/"+marketVersion)
	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("NUBO Market에 연결할 수 없습니다: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return registryResponseError(response)
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 2<<20)).Decode(target); err != nil {
		return fmt.Errorf("NUBO Market 응답을 읽을 수 없습니다: %w", err)
	}
	return nil
}

func registryResponseError(response *http.Response) error {
	var failure registryError
	_ = json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&failure)
	if failure.Error == "" {
		failure.Error = response.Status
	}
	return fmt.Errorf("NUBO Market 요청 실패: %s", failure.Error)
}
