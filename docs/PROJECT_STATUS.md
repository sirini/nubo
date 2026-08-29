# NUBO project status

## Active goal

- v1.3.1의 Source Mode CLI foundation과 pinned runtime `download`는 공식 Ubuntu 검증까지 완료됐다.
- 다음 작업 단위는 checksum 기반 CLI self-update이며, 이후 같은 UI·검증 기반에 Market의
  `search|info|install skins/<key>`를 옮긴다. 제작자 `validate|pack` 기반은 v1.3.x,
  device-code `login|publish` 활성화는 v1.4 범위다.

## Current decisions

- NUBO는 소스 checkout을 운영자가 직접 빌드·실행하는 Source Mode를 기본으로 한다. CLI는 Git, npm,
  Nuxt build, DB migration, tmux·PM2·systemd·Nginx lifecycle을 자동 실행하지 않는다.
- 공식 GOAPI는 `/Users/sirini/github/goapi.git`의 exact commit을 descriptor에 고정하고 반드시 GOAPI의
  `./scripts/build-ubuntu22.sh`를 통해 만든다. runtime에는 Ubuntu 22.04 amd64 GOAPI와 libvips·license만
  포함한다.
- clone에 tracked bootstrap `./bin/nubo`를 포함한다. 첫 실행은 Linux amd64 CLI와 SHA-256을 검증해
  `.nubo/bin/nubo`에 설치하고, 실제 CLI는 checkout에 고정된 runtime만 내려받는다.
- runtime descriptor와 내부 manifest는 version, target, API contract, GOAPI commit, DB migration 필요
  여부를 함께 고정한다. 외부·내부 checksum과 안전한 압축 경로를 검증한 뒤 원자적으로 교체한다.
- CLI는 Bubble Tea v2·Lip Gloss v2를 사용한다. TTY에서는 배경색 적응형 warm-tone UI, CI·pipe에서는
  평문, 자동화에서는 JSON을 제공하고 취소·실패 시 기존 runtime을 보존한다.
- Market 패키지 좌표는 실제 `app/skins/<key>`와 대응하는 `skins/<key>` 복수형을 사용한다. 스킨 설치는
  소스와 영수증만 관리하며 빌드·재시작은 운영자에게 명확히 안내한다.
- 운영 Market의 실행 파일·설정·패키지 데이터는 nubohub.org의
  `/var/www/market/{bin,config,data}`에 모아 관리한다.
- 릴리스 build는 개발 PC 상태와 분리하기 위해 GitHub-hosted Ubuntu 22.04를 기본으로 한다. WSL2
  self-hosted runner는 online일 때 명시적으로 선택하는 cache 가속 수단이며 필수 인프라가 아니다.

## Open findings

- Mac 작업 트리의 `package-lock.json`에는 이번 작업 전부터 플랫폼별 optional dependency가 대량 제거된
  사용자 변경이 있다. 의도가 확인될 때까지 보존하며 v1.3.1 커밋에서 제외한다.
- Market 제작자 device-code token 발급·폐기와 제출 심사 API의 최종 계약은 Market CLI 작업 전에
  `/Users/sirini/github/nubohub-market.git`과 함께 다시 고정해야 한다.

## Recent completion

- nubohub.org에서 중복 `/swapfile`, 사용하지 않는 v1.2 `.nubo` cache와 오래된 journal을 안전하게
  정리해 루트 사용률을 88%에서 56%로 낮췄다. 활성 LVM swap은 보존하고 journal 상한은 512MiB로 뒀다.
- 운영 Market을 `/var/www/market`으로 이전하고 systemd·Nginx·내부 및 외부 readiness, package 39개
  파일의 상대 경로별 hash 일치를 확인했다.
- GOAPI 운영 문서를 Source Mode에 맞춰 `333459e`로 main에 push하고 v1.3.1 runtime의 GOAPI 기준
  commit을 `333459eb652a6170f452e17e777c2f5604ca5eff`으로 고정했다.
- 새 `./bin/nubo` foundation과 runtime release pipeline을 NUBO `e6e3255`로 main에 push했다. offline
  WSL2 runner에 queued된 첫 검증은 취소하고 저장소 runner 변수를 hosted Ubuntu 22.04로 전환했다.

## Verification

- 새 Go CLI는 descriptor·download·archive traversal·checksum·atomic rollback·dry-run·취소 보존 단위
  테스트와 `go test -race ./...`, `go vet ./...`를 통과했다.
- macOS에서 `CGO_ENABLED=0 GOOS=linux GOARCH=amd64` cross-build 결과가 정적 Linux amd64 ELF임을
  확인했다.
- Actions run `33264040728`은 NUBO 64개 테스트·lint 오류 0건(기존 경고 50)·typecheck·production
  build, API contract, GOAPI 공식 Docker test/vet와 `build-ubuntu22.sh` runtime 생성을 통과했다.
  Ubuntu 22.04·24.04에서 launcher bootstrap, 외부·내부 checksum, 원자적 runtime 설치와 libvips 링크를
  각각 검증했으며 수동 run이라 publish는 의도대로 skip됐다.
- Actions artifact의 CLI는 7.8MiB 정적 Linux amd64 ELF, runtime archive는 30MiB다. 외부 SHA-256이
  일치하고 manifest는 NUBO/GOAPI 1.3.1, API contract 1, GOAPI `333459e`, libvips 8.18.3,
  `migrationRequired=false`를 기록한다.

## Next action

1. CLI 자체를 checksum으로 검증·교체하는 `./bin/nubo update`를 구현하고 launcher와의 버전 경계를
   고정한다.
2. Market `search|info|install skins/<key>`를 새 UI와 영수증·변경 감지 계약 위에 옮긴다.
3. 제작자 관점의 로컬 `validate|pack skins/<key>`와 device-code 인증 서버 계약을 설계한다.
