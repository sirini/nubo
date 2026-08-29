# NUBO project status

## Active goal

- v1.3.1의 첫 작업 단위로 Source Mode 전용 `./bin/nubo` UI foundation과 descriptor-pinned
  GOAPI·libvips `download`를 완성하고 공식 Ubuntu 22.04/24.04 검증을 통과시킨다.
- 다음 작업 단위에서 같은 UI·검증 기반에 Market의 `search|info|install skins/<key>`를 옮긴다.
  제작자 `validate|pack` 기반은 v1.3.x, device-code `login|publish` 활성화는 v1.4 범위다.

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

## Open findings

- Mac 작업 트리의 `package-lock.json`에는 이번 작업 전부터 플랫폼별 optional dependency가 대량 제거된
  사용자 변경이 있다. 의도가 확인될 때까지 보존하며 v1.3.1 커밋에서 제외한다.
- 로컬 Mac에는 Docker가 없어 공식 Linux CLI/runtime build는 실행할 수 없다. 소스 검증 후 main에
  커밋·푸시하고 `workflow_dispatch`로 공식 runner의 전체 빌드와 Ubuntu 22.04/24.04 smoke를 확인한다.
- Market 제작자 device-code token 발급·폐기와 제출 심사 API의 최종 계약은 Market CLI 작업 전에
  `/Users/sirini/github/nubohub-market.git`과 함께 다시 고정해야 한다.

## Recent completion

- nubohub.org에서 중복 `/swapfile`, 사용하지 않는 v1.2 `.nubo` cache와 오래된 journal을 안전하게
  정리해 루트 사용률을 88%에서 56%로 낮췄다. 활성 LVM swap은 보존하고 journal 상한은 512MiB로 뒀다.
- 운영 Market을 `/var/www/market`으로 이전하고 systemd·Nginx·내부 및 외부 readiness, package 39개
  파일의 상대 경로별 hash 일치를 확인했다.
- GOAPI 운영 문서를 Source Mode에 맞춰 `333459e`로 main에 push하고 v1.3.1 runtime의 GOAPI 기준
  commit을 `333459eb652a6170f452e17e777c2f5604ca5eff`으로 고정했다.

## Verification

- 새 Go CLI는 descriptor·download·archive traversal·checksum·atomic rollback·dry-run·취소 보존 단위
  테스트와 `go test -race ./...`, `go vet ./...`를 통과했다.
- macOS에서 `CGO_ENABLED=0 GOOS=linux GOARCH=amd64` cross-build 결과가 정적 Linux amd64 ELF임을
  확인했다. 공식 Docker build와 실제 Ubuntu 실행은 Actions 검증 대기 중이다.
- GOAPI 문서 변경 외 backend contract와 pinned commit은 변하지 않았다.

## Next action

1. NUBO frontend test·lint·typecheck·production build, shell syntax와 release contract를 검증한다.
2. NUBO/GOAPI의 v1.3.1 문서·CLI 작업을 각각 focused commit으로 main에 push한다.
3. `Publish Linux release` workflow를 게시 없는 `workflow_dispatch(v1.3.1)`로 실행해 official asset과
   Ubuntu 22.04/24.04 runtime smoke를 확인한다.
4. CLI 자체를 checksum으로 교체하는 `./bin/nubo update`를 추가한 뒤 Market
   `search|info|install skins/<key>` 작업 단위를 시작한다.
