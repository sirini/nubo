# NUBO project status

## Active goal

- 제품 소유자가 npm 탐색 흐름으로 개편한 nubohub.org Market과 nuboctl 안내 페이지를 QA한다.

## Product boundary

- NUBO는 사진 커뮤니티·블로그·게시판에 재사용하는 미디어 중심 커뮤니티 빌더다.
- 현재 운영 대상은 직접 서버를 관리하는 한국어권 개인·소규모 커뮤니티다.
- 공식 prebuilt는 Ubuntu 22.04+ amd64, Node.js 22+, systemd, Nginx, MySQL/MariaDB 단일 서버를 지원한다.
- 컨테이너·Kubernetes·다중 배포판·범용 배포 추상화는 현재 범위가 아니다.

## Current decisions

- NUBO와 GOAPI는 각 저장소의 machine-readable API contract version을 릴리스 전에 일치시킨다.
- 게시 전 필수 게이트는 NUBO test/lint/typecheck/build, 공식 Ubuntu 22 환경의 GOAPI test/vet, contract 일치와 Ubuntu 22.04/24.04 fresh-install이다.
- 무거운 `build-release`는 신뢰하는 WSL2 self-hosted runner에서 실행하고, fresh-install과 최종 게이트·게시는 GitHub hosted runner에서 수행한다.
- 로컬 runner가 없을 때는 `NUBO_RELEASE_BUILD_RUNNER`를 hosted runner로 전환한다. 공개 저장소의 외부 PR에는 self-hosted runner를 사용하지 않는다.
- 공식 릴리스는 고정 GOAPI commit, Nuxt prebuilt, `nuboctl`, 두 libvips 변형과 SHA-256을 하나의 Linux amd64 asset으로 묶는다.
- 운영 서버는 불변 릴리스와 `current` 링크를 사용한다. GOAPI 변경 update는 외부 백업 확인 뒤 migration→링크 전환→restart/readiness 순서로 수행하며, 실패 시 코드와 프로세스만 복구한다.
- 설정·업로드는 릴리스 밖에 보존한다. 사이트 전용 Vue 스킨은 공식 릴리스를 직접 수정하지 않고 `nuboctl customize`로 별도 파생 릴리스를 만든다.
- `nuboctl`은 install/adopt/status/doctor/update/customize/activate-nginx의 최소 운영 경로를 제공하며 기존 systemd·Nginx 파일과 다른 파일을 임의로 덮어쓰지 않는다.
- API contract v1의 application 오류는 기존 HTTP 200 + `success=false`를 유지한다. HTTP status 의미 변경은 contract v2에서 한 번에 다룬다.
- 전체 ESLint 오류는 릴리스를 차단하고, 의미 판단이 필요한 기존 optional prop 46건과 `v-html` 4건은 경고 상한 50건으로 동결한다.
- 자동 테스트는 인증·권한·데이터 손실·동시성·배포처럼 실패 비용이 큰 경계를 우선한다.
- 공개 update는 공식 소스 변경을 덮어쓰지 않는 `git pull --ff-only`를 기본으로 하고, 별도 key의 사이트 스킨 변경만 보존한다.
- 이전·후보의 GOAPI commit이 같으면 DB 준비와 백업 질문을 생략하며, GOAPI가 바뀌는 update는 기존 백업 확인을 유지한다.
- 한 번 성공한 customize는 자동 적용 상태를 기록하고 이후 update에서 새 버전용 Web을 사전 빌드·재적용한다.
- NUBO Market은 비공개 `sirini/nubohub-market` 저장소의 독립 Go Fiber 서비스로 두고, 운영 서버는 MySQL 메타데이터·패키지 파일·API 제공만 담당한다.
- 스킨 패키지는 단일 `<key>/` tar.gz, immutable key/version, Registry SHA-256을 계약으로 삼는다. `nuboctl market install`은 로컬 소스에만 설치하고 기존 `customize`가 빌드·적용한다.
- 결제·계정·커미션·리뷰·서드파티 게시 권한은 MVP 뒤로 미루고, 현재 게시 API는 긴 운영자 토큰 하나로 보호한다.

## Recent completion

- Market을 NUBO식 sticky blur 상단바, npm 오마주 검색 히어로, 터미널 명령 강조, 제작자 카드, 12개 페이징과 랜딩 CTA 구조로 개편하고 별도 `/market/nuboctl` 안내 페이지를 배치했다.
- 기본 스킨 9개의 immutable 0.1.1을 게시하고 태그를 `다크 모드`, `라이트 모드`, `반응형 그리드`로 통일했다.
- NUBO v1.2.20과 nuboctl 0.12.0을 게시하고 nubohub.org를 같은 GOAPI의 무중단 데이터 경계로 업데이트했다.
- `nuboctl market search/info/install`을 공식 명령으로 정하고 기존 `skin` 명령은 호환 별칭으로 유지했다.
- Market·nuboctl의 긴 파일과 함수를 조회·다운로드·압축 검사·명령 dispatch·route·게시 경계로 분리하고 보안 판단에 한글 주석을 보강했다.
- nubohub.org `/market/`에 빌드 없는 카탈로그·상세 화면을 배치하고 현재 `nubo-basic-*` 스킨 9개를 immutable 0.1.0 패키지로 등록했다.
- NUBO Market을 nubohub.org의 별도 비로그인 사용자, MySQL DB, 3009 systemd 서비스와 `/market/` HTTPS 경로로 배치하고 `nubo-basic-home@0.1.0`을 첫 패키지로 게시했다.
- NUBO Market MVP의 공개 목록·상세·버전·다운로드와 토큰 보호 게시 API, MySQL 저장소, 안전한 패키지 검사, Ubuntu 22.04 빌드와 systemd/Nginx 자산을 비공개 저장소 `35e20aa`로 게시했다.
- `nuboctl` 0.12.0에 `market search/info/install`을 추가해 checksum·호환 버전·archive 안전성·기존 폴더 비덮어쓰기를 보장하고 `customize`로 연결했다. 기존 `skin` 표기는 호환 별칭으로 유지한다.
- v1.2.19에서 safe fast-forward pull, 등록된 커스텀 Web 자동 재적용, GOAPI 동일 시 migration·백업 질문 생략을 게시했다.
- v1.2.18을 첫 혼합 릴리스 경로로 게시해 로컬 build, hosted fresh-install과 GitHub Release 게시를 최종 확인했다.
- NUBO v1.2.17과 GOAPI `85186af`를 게시·운영 반영하고 Android Google ID token audience 분리를 실기기에서 확인했다.
- Android token 회전, FID 푸시, 계정 완전 삭제, 신고와 차단 분리, 공개 이용약관을 NUBO/GOAPI 공통 기능으로 반영했다.
- WSL2 `nubo-release` runner, hosted fallback, 수동 full preflight와 최신 JavaScript actions를 구성했다.

## Open findings

- `nuboctl market`은 아직 자동 remove를 제공하지 않는다. 설치 시 기록한 manifest/checksum으로 사용자 수정 여부를 판별한 뒤 안전하게 삭제하는 상태 모델이 필요하다.
- Market MVP는 유료 권한·구매 취소·서명된 단기 URL을 제공하지 않는다. 판매 모델을 정할 때 계정 인증과 entitlement 경계를 별도 설계해야 한다.
- Market 백업은 `nubohub_market` DB와 패키지 저장 디렉터리를 같은 시점의 세트로 보존해야 한다.
- update는 데이터 백업·복원을 수행하지 않으며 GOAPI 변경 릴리스는 외부 백업을 전제로 한다.
- Vite 8/Rolldown의 저사양 CPU 교착이 해결되면 임시 `rolldown-vite@7.3.1` override를 제거한다.
- Certbot/TLS와 외부 DB·메일의 실제 운영 검증은 fresh-install smoke 범위 밖이다.

## Verification

- Market `b5a26c3`/`d2f5ae5` run `32570563315`/`32570742778`의 Ubuntu 22.04 build/test와 MySQL 통합 smoke를 통과했다. 데스크톱 dark·모바일 light 실브라우저 캡처를 확인했고, 운영 목록 9개·공통 태그 검색 9개·nuboctl 페이지·CSP와 NUBO/GOAPI/Market/Nginx active를 확인했다.
- 새 운영 Market 바이너리 SHA-256은 `0a59f3b90860c02297c1473c3218b97e84e1d0ba669c4ac28562d949277cf82a`이며 stylesheet cache-busting을 적용했다. 직전 바이너리는 `/var/backups/nubohub-market/assets-d2f5ae5`에 보존했다.
- v1.2.20 run `32568166081`: 통합 build 2분 30초, Ubuntu 22.04/24.04 fresh-install 19초/23초와 게시를 통과했다. 공개 asset SHA-256 `043bc65cf9cf9c2fad09517d6422cb49609e6bc1af25204c5b6c61f5a47aba2b`, clean NUBO/nuboctl `85a1130`, GOAPI `85186af`, nuboctl 0.12.0을 확인했다.
- nubohub.org를 1.2.19에서 1.2.20으로 전환한 뒤 `nuboctl status` 15건, 내부·외부 version/readiness, `market search/info`, NUBO·GOAPI·Market·Nginx active를 확인했다. GOAPI가 같아 migration과 백업 질문은 생략됐다.
- Market `53f3e50` run `32568424692`의 Ubuntu 22.04 build/test와 MySQL 통합 smoke를 통과했다. 운영 바이너리 SHA-256은 `4969f5187831a18bc01bb8b89cf8d729701ae9e4c7d8efb6cd0633d551581cff`이며 이전 바이너리는 `/var/backups/nubohub-market/market-cli-53f3e50`에 보존했다.
- 리팩터링 뒤 이번 Market/nuboctl 구현의 최대 함수는 각각 44줄/32줄이며 관련 구현 파일은 50~187줄로 분리했다. 기존 169줄 CLI dispatch도 명령별 handler로 분리했다. 전체 Go test/race/vet와 9개 기본 스킨 게시를 포함한 MySQL 통합 smoke를 통과했다.
- 외부 `/market/` 목록 9개, 검색·상세·CSS, CSP, 각 설치 명령과 SHA-256 노출을 확인했다. 새 Market 바이너리는 기존 바이너리를 `/var/backups/nubohub-market/catalog-e18a594`에 보존한 뒤 적용했다.
- 운영 서버의 내부·외부 Market readiness, 별도 사용자와 systemd hardening, 제한된 DB 권한, Nginx 설정, 게시·목록·상세·다운로드를 확인했다. 무토큰 게시 401, 중복 버전 409, 운영 패키지 SHA-256과 로컬 `nuboctl` 설치 결과의 원본 일치를 확인했으며 기존 NUBO Web readiness도 정상이다.
- NUBO Market `go test ./...`, `go vet ./...`, MySQL 8 게시→조회→다운로드 원본 비교와 실제 `nuboctl` 설치 통합 smoke를 통과했다. Ubuntu 22.04 컨테이너에서 정적 linux/amd64 바이너리 SHA-256 `0fdeab264d933abe855ca2140cb84b38aad8e813ea074e8eaf4c730eb2775ff4`를 만들었다.
- NUBO nuboctl 전체 Go test/vet, 0.12.0 Ubuntu 22.04/24.04 실행, unit 28건, ESLint 오류 0건(기존 경고 50), typecheck를 통과했다.
- v1.2.19 run `32561064226`: 로컬 통합 build 2분 36초, hosted Ubuntu 22.04/24.04 fresh-install 25초/18초와 게시를 통과했다. 공개 asset checksum, clean NUBO/nuboctl `73c8a3c`, GOAPI `85186af`, nuboctl 0.11.0, API contract 1을 확인했다.
- source pull 단위 테스트 4건, 전체 NUBO 테스트 32건, ESLint 오류 0건(기존 경고 50), typecheck, production build, API contract 일치, nuboctl test/race/vet를 통과했다. Linux amd64 nuboctl 0.12.0에서 실제 `market search board`도 확인했다.
- v1.2.18 run `32559598632`: WSL2 self-hosted build 2분 35초, hosted Ubuntu 22.04/24.04 fresh-install 18초/19초와 게시를 통과했다. 공개 asset의 SHA-256, clean NUBO/nuboctl `1b34bd3`, GOAPI `85186af`, API contract 1을 다시 확인했다.
- sensta.me update 후 `nuboctl status` 16건과 `doctor` 17건, GOAPI/Web/Nginx, 내부·외부 `/ready`와 `/version`을 확인했다.

## Next action

- 제품 소유자가 `https://nubohub.org/market/`과 `/market/nuboctl`의 데스크톱·모바일 흐름을 확인한다. 다음 범위는 피드백 뒤 스킨 미리보기 자산 또는 checksum 기반 안전한 `market remove` 중 하나로 정하며 결제·커미션은 계속 보류한다.
