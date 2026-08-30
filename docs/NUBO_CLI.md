# NUBO CLI

`./bin/nubo`는 현재 NUBO source checkout에 검증된 구성요소를 공급하는 작은 도구다. 서버 lifecycle을
관리하지 않는다.

## 현재 명령

```bash
./bin/nubo
./bin/nubo version
./bin/nubo search gallery
./bin/nubo search --json gallery
./bin/nubo info skins/nubo-advance-gallery
./bin/nubo info --json skins/nubo-advance-gallery
./bin/nubo update --dry-run
./bin/nubo update
./bin/nubo download --dry-run
./bin/nubo download
```

인자 없이 TTY에서 실행하면 대화형 시작 화면을 표시한다. 비대화형 환경에서는 도움말을 출력한다.

## search와 info

공식 Market의 공개 스킨을 읽기 전용으로 조회한다. package 좌표는 실제 소스 경로와 대응하는
`skins/<key>`만 허용한다.

- `search [검색어]`: 이름·key·설명·기능 검색. 검색어를 생략하면 전체 최신 스킨을 조회한다.
- `search --limit 20 --offset 20`: 최대 100개 단위의 명시적 offset pagination.
- `info skins/<key>`: 최신 공개 버전, 제작자, 기능, 크기, SHA-256과 현재 checkout 호환성 확인.
- `--json`: `status`, checkout의 `nuboVersion`, package 좌표와 `compatible`을 포함한 JSON 출력.

CLI가 소비하는 Market v1 read-only 계약은 `GET /v1/skins?q=&limit=&offset=`와
`GET /v1/skins/:key`다. 응답의 `key`, `version`, `min_nubo_version`, `sha256`, `size_bytes`,
`published_at`, `download_url`을 검증하며 2MiB보다 큰 응답은 거부한다. 기본 주소는
`https://nubohub.org/market`이고 개발·통합 테스트에서는 `NUBO_MARKET_BASE_URL`로 HTTPS 또는 loopback
HTTP 주소만 지정할 수 있다. 조회 명령은 소스, package, runtime과 Market 다운로드 수를 변경하지 않는다.

## update

현재 checkout의 descriptor가 고정한 `nubo-linux-amd64`와 SHA-256을 확인한다. 새 파일은 64MiB로
제한하고 Linux x86-64 ELF 형식과 `nubo <version>` 실행 결과까지 검증한 뒤 `.nubo/bin/nubo` 하나만
원자적으로 교체한다. 이미 같은 공식 checksum이면 다운로드와 교체를 생략한다.

`--dry-run`은 새 실행 파일을 staging에서 실제로 실행해 확인하되 현재 CLI를 유지한다. 소스, runtime,
DB와 실행 중인 프로세스는 어떤 경우에도 변경하지 않는다.

## download

`deploy/release-sources.json`에서 NUBO version, release tag, API contract, GOAPI commit과 공식 asset 이름을
읽는다. 임의의 latest runtime이나 다른 GOAPI 조합은 선택하지 않는다.

검증 순서:

1. descriptor와 `env.sample` 버전 일치
2. GitHub Release의 archive SHA-256
3. archive 경로 이탈, 링크·특수 파일과 크기 제한
4. runtime manifest의 version·target·API contract·GOAPI commit
5. 모든 내부 파일의 SHA-256과 필수 GOAPI·libvips 파일
6. 같은 파일시스템 staging과 기존 runtime 복구가 가능한 교체

설치 대상:

```text
bin/goapi
lib
licenses/sharp-libvips
.nubo/runtime.json
.nubo/runtime-manifest.json
```

`bin/nubo` launcher와 `app`, `.env`, upload, DB와 빌드 결과는 변경하지 않는다.

## 출력과 자동화

- TTY: Bubble Tea inline 진행 화면
- pipe/CI: 평문 단계 출력
- `NO_COLOR`: ANSI 색상 비활성화
- `--plain`: 애니메이션 비활성화
- `--json`: stderr 진행 로그 + stdout 결과 JSON
- `--yes`: 기존 runtime 교체 확인 생략
- `--dry-run`: 다운로드와 전체 검증만 수행

Ctrl+C 취소는 다운로드 임시 파일과 staging만 정리한다. 기존 runtime은 모든 검증이 끝날 때까지 유지한다.

## 하지 않는 일

- `git pull` 또는 소스 병합
- npm install, Nuxt build
- GOAPI DB migration
- tmux, PM2, systemd 시작·중지·재시작
- Nginx와 TLS 변경
- 백업과 복구

완료 화면은 위 작업 중 현재 릴리스 이후 운영자가 확인해야 할 항목을 명시한다.

## 다음 단계

v1.3.x에서 같은 UI·검증 기반에 `install skins/<key>`와 로컬 `validate|pack`을 추가한다.
Market login·publish는 device-code 인증과 운영 심사 흐름을 완성한 v1.4에서 활성화한다.
