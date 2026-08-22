# NUBO project status

## Active goal

- 작은 UI 보정을 다음 patch로 게시해 로컬 `build-release`, hosted fresh-install, GitHub Release로 이어지는 혼합 릴리스 경로를 실제 태그에서 최종 확인한다.

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
- 운영 서버는 불변 릴리스와 `current` 링크를 사용한다. update는 외부 백업 확인 뒤 migration→링크 전환→restart/readiness 순서로 수행하며, 실패 시 코드와 프로세스만 복구한다.
- 설정·업로드는 릴리스 밖에 보존한다. 사이트 전용 Vue 스킨은 공식 릴리스를 직접 수정하지 않고 `nuboctl customize`로 별도 파생 릴리스를 만든다.
- `nuboctl`은 install/adopt/status/doctor/update/customize/activate-nginx의 최소 운영 경로를 제공하며 기존 systemd·Nginx 파일과 다른 파일을 임의로 덮어쓰지 않는다.
- API contract v1의 application 오류는 기존 HTTP 200 + `success=false`를 유지한다. HTTP status 의미 변경은 contract v2에서 한 번에 다룬다.
- 전체 ESLint 오류는 릴리스를 차단하고, 의미 판단이 필요한 기존 optional prop 46건과 `v-html` 4건은 경고 상한 50건으로 동결한다.
- 자동 테스트는 인증·권한·데이터 손실·동시성·배포처럼 실패 비용이 큰 경계를 우선한다.

## Recent completion

- NUBO v1.2.17과 GOAPI `85186af`를 게시·운영 반영하고 Android Google ID token audience 분리를 실기기에서 확인했다.
- Android token 회전, FID 푸시, 계정 완전 삭제, 신고와 차단 분리, 공개 이용약관을 NUBO/GOAPI 공통 기능으로 반영했다.
- WSL2 `nubo-release` runner, hosted fallback, 수동 full preflight와 최신 JavaScript actions를 구성했다.

## Open findings

- 다음 patch의 실제 태그 push에서 로컬 build, hosted fresh-install, Release 게시까지 한 번에 확인해야 한다.
- 공식 update 직후에는 공식 Web이 실행되므로 사이트 전용 스킨은 운영자가 `nuboctl customize`로 다시 적용해야 한다.
- 내부·공개 update는 데이터 백업·복원을 수행하지 않으며 외부 백업을 전제로 한다.
- Vite 8/Rolldown의 저사양 CPU 교착이 해결되면 임시 `rolldown-vite@7.3.1` override를 제거한다.
- Certbot/TLS와 외부 DB·메일의 실제 운영 검증은 fresh-install smoke 범위 밖이다.

## Verification

- UI patch: 전체 ESLint 오류 0건, NUBO 28개 테스트, typecheck와 production build를 통과했다.
- 혼합 runner smoke run `32553785565`: 로컬 checkout, 32 CPU/30GiB, Docker 실행을 10초에 확인했다.
- 게시 없는 full preflight run `32554073029`: 로컬 통합 build 2분 28초, hosted Ubuntu 22.04/24.04 fresh-install 18초/19초를 통과했다.
- v1.2.17 run `32551859327`: 기존 hosted 경로의 모든 게이트와 게시를 통과했고 공개 asset의 clean NUBO `4f32d9a`, GOAPI `85186af`, SHA-256을 확인했다.
- sensta.me update 후 `nuboctl status` 16건과 `doctor` 17건, GOAPI/Web/Nginx, 내부·외부 `/ready`와 `/version`을 확인했다.

## Next action

- 요청한 메뉴 아이콘·모바일 여백·홈 문구를 검증하고 다음 patch 태그를 게시한다.
- 게시 뒤 혼합 runner 선택, clean provenance, Ubuntu 22.04/24.04 fresh-install과 공개 asset을 확인한다.
- 이후 제품 작업은 S1-Q01 request ID/구조화 로그와 S1-Q02 오류 분류의 최소 범위를 합의한 뒤 시작한다.
