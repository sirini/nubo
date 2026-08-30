package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestCLISearchJSONUsesPublicMarketContract(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	item := testMarketSkin()
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/v1/skins" || request.URL.Query().Get("q") != "gallery" || request.URL.Query().Get("limit") != "20" {
			http.Error(writer, "unexpected request", http.StatusBadRequest)
			return
		}
		if request.Header.Get("Accept") != "application/json" || !strings.HasPrefix(request.Header.Get("User-Agent"), "nubo/") {
			http.Error(writer, "missing client headers", http.StatusBadRequest)
			return
		}
		_ = json.NewEncoder(writer).Encode(marketSearchResponse{Items: []marketSkin{item}, Total: 1, Limit: 20, Offset: 0})
	}))
	defer server.Close()

	var output, errors bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &errors)
	application.getenv = marketTestEnv(server.URL)
	if code := application.run([]string{"search", "--root", root, "--json", "gallery"}); code != 0 {
		t.Fatalf("exit=%d stderr=%s", code, errors.String())
	}
	var result marketSearchResult
	if err := json.Unmarshal(output.Bytes(), &result); err != nil {
		t.Fatalf("stdout is not JSON: %v\n%s", err, output.String())
	}
	if result.Status != "ok" || result.Query != "gallery" || result.NUBOVersion != "1.3.1" || len(result.Items) != 1 {
		t.Fatalf("result=%+v", result)
	}
	if result.Items[0].Coordinate != "skins/nubo-test" || !result.Items[0].Compatible {
		t.Fatalf("item=%+v", result.Items[0])
	}
	if errors.Len() != 0 {
		t.Fatalf("stderr=%s", errors.String())
	}
}

func TestCLIInfoJSONUsesNamespacedCoordinate(t *testing.T) {
	sources := testSources("1.3.1")
	root := makeProjectRoot(t, sources)
	item := testMarketSkin()
	item.MinNUBOVersion = "1.4.0"
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/v1/skins/nubo-test" {
			http.NotFound(writer, request)
			return
		}
		_ = json.NewEncoder(writer).Encode(item)
	}))
	defer server.Close()

	var output, errors bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &errors)
	application.getenv = marketTestEnv(server.URL)
	if code := application.run([]string{"info", "--root", root, "--json", "skins/nubo-test"}); code != 0 {
		t.Fatalf("exit=%d stderr=%s", code, errors.String())
	}
	var result marketInfoResult
	if err := json.Unmarshal(output.Bytes(), &result); err != nil {
		t.Fatalf("stdout is not JSON: %v\n%s", err, output.String())
	}
	if result.Skin.Coordinate != "skins/nubo-test" || result.Skin.Compatible {
		t.Fatalf("skin=%+v", result.Skin)
	}
}

func TestCLIInfoRejectsUnnamespacedCoordinateBeforeNetwork(t *testing.T) {
	var output, errors bytes.Buffer
	application := newCLI(strings.NewReader(""), &output, &errors)
	if code := application.run([]string{"info", "nubo-test"}); code != 2 {
		t.Fatalf("exit=%d stderr=%s", code, errors.String())
	}
	if !strings.Contains(errors.String(), "skins/<key>") {
		t.Fatalf("stderr=%s", errors.String())
	}
}

func TestMarketClientRejectsRemotePlainHTTP(t *testing.T) {
	_, err := newMarketClient("http://example.com/market", nil)
	if err == nil || !strings.Contains(err.Error(), "HTTPS") {
		t.Fatalf("expected HTTPS error, got %v", err)
	}
}

func TestMarketClientRejectsInvalidPackageIdentity(t *testing.T) {
	item := testMarketSkin()
	item.SHA256 = "not-a-checksum"
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(writer).Encode(item)
	}))
	defer server.Close()
	client, err := newMarketClient(server.URL, nil)
	if err != nil {
		t.Fatal(err)
	}
	_, err = client.info(t.Context(), "nubo-test")
	if err == nil || !strings.Contains(err.Error(), "SHA-256") {
		t.Fatalf("expected checksum error, got %v", err)
	}
}

func TestMarketClientRejectsChunkedResponseOverLimit(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.(http.Flusher).Flush()
		_, _ = writer.Write(bytes.Repeat([]byte(" "), maxMarketResponseBytes+1))
	}))
	defer server.Close()
	client, err := newMarketClient(server.URL, nil)
	if err != nil {
		t.Fatal(err)
	}
	_, err = client.info(t.Context(), "nubo-test")
	if err == nil || !strings.Contains(err.Error(), "허용 크기") {
		t.Fatalf("expected response size error, got %v", err)
	}
}

func TestVersionAtLeast(t *testing.T) {
	for _, test := range []struct {
		current string
		minimum string
		want    bool
	}{
		{"1.3.1", "1.3.1", true},
		{"1.3.1", "1.2.30", true},
		{"1.3.1", "1.4.0", false},
		{"2.0.0", "1.99.99", true},
		{"1.3.1-beta.1", "1.3.1", false},
	} {
		if got := versionAtLeast(test.current, test.minimum); got != test.want {
			t.Errorf("versionAtLeast(%q, %q)=%v, want %v", test.current, test.minimum, got, test.want)
		}
	}
}

func testMarketSkin() marketSkin {
	return marketSkin{
		Key: "nubo-test", Name: "테스트 스킨", Version: "1.0.0", Author: "NUBO",
		Website: "https://nubohub.org", Description: "안전한 테스트 스킨", Preview: "preview.png",
		Features: []string{"반응형"}, MinNUBOVersion: "1.2.0", SHA256: strings.Repeat("a", 64),
		SizeBytes: 1024, Downloads: 3, PublishedAt: time.Date(2026, 8, 30, 0, 0, 0, 0, time.UTC),
		DownloadURL: "https://nubohub.org/market/v1/skins/nubo-test/versions/1.0.0/download",
		PreviewURL:  "https://nubohub.org/market/v1/skins/nubo-test/versions/1.0.0/assets/preview",
	}
}

func marketTestEnv(baseURL string) func(string) string {
	return func(name string) string {
		if name == "NUBO_MARKET_BASE_URL" {
			return baseURL
		}
		return ""
	}
}
