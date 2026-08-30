# NUBO project status

## Active goal

- 현재 진행 중인 bounded task는 없다.

## Current decisions

- `GET /board/my/studio`는 API contract v1을 유지하는 additive JWT endpoint다. 사용자 UID는 token에서만
  얻고 본인의 일반글·비밀글만 대상으로 DB aggregate와 page query를 실행한다.
- 기존 필터 및 `post_uid` 인덱스로 범위를 효율적으로 제한할 수 있어 studio용 DB migration은 추가하지
  않았다. 운영 데이터에서 병목이 확인될 때만 `EXPLAIN` 근거로 복합 인덱스를 검토한다.
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
- TSBOARD 1.3.0은 NUBO 1.3.0 Linux amd64 릴리스의 GOAPI 1.3.0·libvips 8.18.3 조합을 descriptor에
  고정하고, `npm run runtime:download`로 `bin/goapi`, `lib`, `licenses/sharp-libvips`에 준비한다.

## Open findings

- Market 제작자 device-code token 발급·폐기와 제출 심사 API의 최종 계약은 인증 CLI 작업 전에
  `/Users/sirini/github/nubohub-market.git`과 함께 다시 고정해야 한다.

## Recent completion

- Sensta Android용 `GET /board/my/studio`를 GOAPI `cb485a4`로 main에 push했다. JWT UID 격리, 본인 비밀글
  포함, 삭제글·공지 제외, 실제 첨부 이미지와 liked/댓글 상태 집계, 네 정렬·paging·공개 cover 제한을
  구현했고 NUBO에 동일 경로 proxy와 TypeScript 계약을 추가했다. 기존 release provenance는 변경하지 않았다.
- nubohub.org에서 중복 `/swapfile`, 사용하지 않는 v1.2 `.nubo` cache와 오래된 journal을 안전하게
  정리해 루트 사용률을 88%에서 56%로 낮췄다. 활성 LVM swap은 보존하고 journal 상한은 512MiB로 뒀다.
- 운영 Market을 `/var/www/market`으로 이전하고 systemd·Nginx·내부 및 외부 readiness, package 39개
  파일의 상대 경로별 hash 일치를 확인했다.
- GOAPI 운영 문서를 Source Mode에 맞춰 `333459e`로 main에 push하고 v1.3.1 runtime의 GOAPI 기준
  commit을 `333459eb652a6170f452e17e777c2f5604ca5eff`으로 고정했다.
- 새 `./bin/nubo` foundation과 runtime release pipeline을 NUBO `e6e3255`로 main에 push했다. offline
  WSL2 runner에 queued된 첫 검증은 취소하고 저장소 runner 변수를 hosted Ubuntu 22.04로 전환했다.
- checksum 검증, Linux amd64 ELF·실행 버전 확인, 원자적 교체와 실패 시 보존을 갖춘 CLI self-update를
  NUBO `5bca081`로 main에 push했다. `update`는 소스·runtime·DB·서비스를 변경하지 않는다.
- Market 저장소와 운영 API를 대조해 v1 read-only 계약을 고정하고 `search [query]`와
  `info skins/<key>`를 구현했다. package namespace, pagination, 응답 크기·identity 검증과 현재 NUBO
  버전 호환성, 평문·JSON 출력을 포함하며 NUBO `ee589cd`로 main에 push했다.
- `install skins/<key>`에 cache SHA-256, 안전한 archive·manifest·asset 검증, 기존 nubo-market 호환
  파일별 영수증, unmanaged·로컬/동시 변경 감지와 원자적 상위 버전 교체를 구현했다.
- `validate|pack skins/<key>`에 실제 Market manifest·asset·경로·크기 계약, 설치 영수증 제외, source
  동시 변경 감지와 고정 metadata 기반의 재현 가능한 원자적 package 생성을 구현했다.
- advance gallery·blog와 basic blog에 작성자 또는 게시판 권한 관리자가 볼 수 있는 공통 게시글 삭제
  버튼·확인창을 연결했다. basic blog 수정도 관리자에게 허용했으며, basic board·gallery·trade의 기존
  관리 메뉴까지 포함해 여섯 게시판형 스킨의 노출과 API 연결을 회귀 테스트로 고정했다.
- TSBOARD에 공식 runtime의 외부·내부 checksum, manifest, Linux amd64 ELF와 안전한 archive 경로를
  검증하는 `runtime:download`를 추가해 `3ecfe14`로 main에 push했다. 영수증 기반 원자적 설치·업데이트와
  `goapi-runtime` 보존, NUBO와 같은 `bin/goapi`·`lib` 구조를 제공한다.
- storage root 이전 뒤에도 DB의 과거 절대 경로에 의존하지 않도록 Market의 package download·preview
  경로를 불변 identity에서 재계산하고 `99aad10`으로 Market main에 push했다.
- Market `99aad10`을 공식 Ubuntu 22.04 컨테이너로 빌드해 운영 배포했다. 이전 바이너리는
  `/var/www/market/bin/nubohub-market.pre-99aad10`에 보존했고 service readiness와 외부 package·preview를
  확인했다.

## Verification

- studio repository/service/handler/router 회귀 테스트와 GOAPI `go test ./...`, `go vet ./...`를 통과했다.
  공식 `build-ubuntu22.sh`는 Ubuntu 22.04·24.04 및 x86-64 runtime 검증을 통과했다. NUBO는 전체 72개
  테스트, lint 오류 0건(기존 경고 50), typecheck, production build, API contract v1 검증을 통과했다.
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
- Actions run `33265126877`은 self-update를 포함한 전체 release build와 Ubuntu 22.04·24.04 smoke를
  통과했다. 두 환경 모두 손상시킨 설치 CLI를 공식 asset으로 복구한 뒤 재실행에서 최신 checksum임을
  JSON으로 확인했으며, 수동 run이라 publish는 의도대로 skip됐다.
- Market CLI 단위 테스트와 `go test -race ./...`, `go vet ./...`를 통과했고 운영
  `https://nubohub.org/market/v1` 응답에 대한 실제 조회도 확인했다.
- install 신규·업데이트·current·dry-run, checksum·traversal·예약 파일, unmanaged·수정·추가·누락·동시
  변경과 NUBO 비호환 거부 테스트가 race에서 통과했다. Market storage 이전 회귀 테스트와 MySQL 통합
  smoke도 통과했다.
- validate·pack의 unsafe source/output, deterministic checksum, 기존 파일 보존과 생성 package의 install
  계약 테스트를 통과했다. 실제 `nubo-advance-gallery@0.2.2` 10개 파일을 검증해 1,896,743-byte package와
  SHA-256 `5b4988f9d5aece34954c026964e962fc4dcaec924d240728c67d5df37a76efe6`을 재현했다.
- 게시글 관리 액션 단위 계약을 포함한 frontend unit 60개와 Nuxt 9개, lint 오류 0건(기존 경고 50),
  typecheck·production build와 GOAPI board service 테스트를 통과했다. GOAPI는 작성자 또는
  최고·그룹·게시판 관리자만 수정·삭제를 허용하고 상세 응답의 `isAdmin`도 같은
  `CheckPermissionByUid` 결과임을 대조했다.
- 제품 소유자 QA에서 작성자·관리자 게시글 관리 동작이 실제 화면에서도 정상임을 확인했다.
- TSBOARD runtime 합성 archive의 신규·current·dry-run·관리 업데이트·수정 감지·위험 경로·manifest와
  checksum 거부·cache 테스트를 포함해 전체 22개 테스트, format, lint, typecheck와 production build를
  통과했다. 공식 NUBO 1.3.0 archive의 실제 다운로드·설치·재실행도 검증했고 GOAPI가
  `$ORIGIN/../lib`의 glibc-hwcaps libvips를 정상 해석했다.
- 운영 이전 바이너리에서 `HTTP 500 package file unavailable`을 재현한 뒤 Market `99aad10` 배포로
  복구했다. `nubo-advance-gallery@0.2.0`의 외부·내부 download SHA-256
  `46611c10da263b9b125c01be5559af75216e527dbccb2cb098533c882bae25cc`과 preview를 확인했고, 실제 CLI
  `install --dry-run`은 파일 9개를 검증한 뒤 `app/skins`를 변경하지 않았다.

## Next action

1. Sensta Android에서 새 DTO와 endpoint를 연결해 동명이인·다중 이미지·빈 계정·paging 실제 QA를 한다.
