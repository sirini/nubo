# NUBO project status

## Active goal

- `nuboctl update` 한 명령으로 safe fast-forward pull, 공식 update와 등록된 커스텀 Web 재적용을 처리하고 UI-only 릴리스의 반복 백업 질문을 제거한다.

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

## Recent completion

- v1.2.18을 첫 혼합 릴리스 경로로 게시해 로컬 build, hosted fresh-install과 GitHub Release 게시를 최종 확인했다.
- NUBO v1.2.17과 GOAPI `85186af`를 게시·운영 반영하고 Android Google ID token audience 분리를 실기기에서 확인했다.
- Android token 회전, FID 푸시, 계정 완전 삭제, 신고와 차단 분리, 공개 이용약관을 NUBO/GOAPI 공통 기능으로 반영했다.
- WSL2 `nubo-release` runner, hosted fallback, 수동 full preflight와 최신 JavaScript actions를 구성했다.

## Open findings

- update는 데이터 백업·복원을 수행하지 않으며 GOAPI 변경 릴리스는 외부 백업을 전제로 한다.
- Vite 8/Rolldown의 저사양 CPU 교착이 해결되면 임시 `rolldown-vite@7.3.1` override를 제거한다.
- Certbot/TLS와 외부 DB·메일의 실제 운영 검증은 fresh-install smoke 범위 밖이다.

## Verification

- v1.2.19 candidate: source pull 단위 테스트 4건, 전체 NUBO 테스트 32건, ESLint 오류 0건(기존 경고 50), typecheck, production build, API contract v1 일치, nuboctl test/race/vet를 통과했다.
- v1.2.18 run `32559598632`: WSL2 self-hosted build 2분 35초, hosted Ubuntu 22.04/24.04 fresh-install 18초/19초와 게시를 통과했다. 공개 asset의 SHA-256, clean NUBO/nuboctl `1b34bd3`, GOAPI `85186af`, API contract 1을 다시 확인했다.
- sensta.me update 후 `nuboctl status` 16건과 `doctor` 17건, GOAPI/Web/Nginx, 내부·외부 `/ready`와 `/version`을 확인했다.

## Next action

- v1.2.19 통합 bundle과 Ubuntu 22.04/24.04 fresh-install을 검증해 게시한다.
- sensta.me에서 한 명령 update와 커스텀 Web 자동 재적용을 QA한다.
