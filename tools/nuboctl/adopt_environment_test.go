package main

import (
	"os"
	"path/filepath"
	"slices"
	"testing"
)

// v1.2.0 형식의 참조값과 업로드 경로를 새 런타임 계약으로 변환한다.
func TestPrepareAdoptedEnvironmentConvertsLegacyValues(t *testing.T) {
	source := t.TempDir()
	legacy := "GOAPI_BASE=api\nGOAPI_PORT=3010\nGOAPI_DOMAIN=https://community.example.com\nGOAPI_TITLE=Community\nGOAPI_VERSION=1.1.3\n" +
		"JWT_SECRET_KEY=secret\nDB_HOST=127.0.0.1\nDB_USER=nubo\nDB_PASS=pass\nDB_NAME=nubo\nDB_TABLE_PREFIX=nubo_\nADMIN_ID=admin@example.com\nADMIN_PW=password\n" +
		"NUXT_PUBLIC_GOAPI_PATH=${GOAPI_BASE}\nNUXT_PUBLIC_VERSION=${GOAPI_VERSION}\nNUXT_PUBLIC_DOMAIN=${GOAPI_DOMAIN}\nNUXT_PUBLIC_TITLE=${GOAPI_TITLE}\nGMAIL_ID=mail@example.com\n"
	if err := os.WriteFile(filepath.Join(source, ".env"), []byte(legacy), 0o600); err != nil {
		t.Fatal(err)
	}
	values, domain, upload, warnings, err := prepareAdoptedEnvironment(source)
	if err != nil {
		t.Fatal(err)
	}
	if domain != "community.example.com" || upload != filepath.Join(source, "upload") {
		t.Fatalf("domain/upload = %s / %s", domain, upload)
	}
	if values["NUXT_PUBLIC_GOAPI_BASE"] != "api" || values["NUXT_API_BASE_INTERNAL"] != "http://127.0.0.1:3010/api" {
		t.Fatalf("GOAPI 런타임 변환 실패: %#v", values)
	}
	if values["DB_PORT"] != "3306" || values["NUBO_UPLOAD_DIR"] != upload {
		t.Fatalf("기본값 변환 실패: %#v", values)
	}
	if _, exists := values["GOAPI_VERSION"]; exists {
		t.Fatal("레거시 GOAPI_VERSION을 새 릴리스에 덮어쓰려고 합니다")
	}
	if !slices.Contains(warnings, "GMAIL_ID") {
		t.Fatalf("Gmail 폐기 경고가 없습니다: %v", warnings)
	}
}

func TestPrepareAdoptedEnvironmentRejectsReferenceCycle(t *testing.T) {
	source := t.TempDir()
	if err := os.WriteFile(filepath.Join(source, ".env"), []byte("GOAPI_DOMAIN=${NUXT_PUBLIC_DOMAIN}\nNUXT_PUBLIC_DOMAIN=${GOAPI_DOMAIN}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, _, _, _, err := prepareAdoptedEnvironment(source); err == nil {
		t.Fatal("환경 변수 순환 참조를 허용했습니다")
	}
}
