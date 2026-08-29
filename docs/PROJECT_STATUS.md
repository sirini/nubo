# NUBO project status

## Active goal

- v1.3.x에서 Source Mode 운영에 맞게 기존 `nuboctl`·`nubo-market`을 단일 `nubo` 명령으로 축소·통합하는
  명령 계약을 정한다. 서비스 제어는 자동화하지 않고 공식 GOAPI·libvips 다운로드와 스킨 소스 관리를
  핵심 책임으로 둔다.

## Product boundary

- NUBO는 사진 커뮤니티·블로그·게시판에 재사용하는 미디어 중심 커뮤니티 빌더다.
- 현재 대상은 직접 서버를 관리하는 한국어권 개인·소규모 커뮤니티다.
- 공식 prebuilt는 Ubuntu 22.04+ amd64, Node.js 22+, systemd, Nginx, MySQL/MariaDB 단일 서버를 지원한다.
- 컨테이너·Kubernetes·다중 배포판, Certbot/TLS와 외부 DB·메일 제공자 설치는 현재 범위가 아니다.
- DB·업로드, Market DB·패키지의 백업·복원·보존은 배포 환경 운영자 책임이다.

## Current decisions

- NUBO와 GOAPI는 하나의 통합 제품으로 같은 공개 버전을 사용하고, 릴리스 manifest가 exact commit과
  machine-readable API contract를 고정한다.
- 공식 GOAPI 바이너리는 GOAPI의 `./scripts/build-ubuntu22.sh`로만 만든다.
- 운영 서버는 불변 릴리스와 `current` 링크를 사용하고 설정·업로드는 릴리스 밖에 둔다.
- Nginx와 TLS는 운영자 소유이며 NUBO 도구가 읽거나 생성·수정·reload하지 않는다.
- `nuboctl`의 기본 책임은 `status`, `doctor`, 명시적 후보의 `apply`다. 다운로드·Git·Nuxt 빌드는
  apply와 분리한다. 기존 update·customize·market·skin은 호환 경로로 유지한다.
- `nubo-market`은 스킨 소스의 검색·검증·설치·변경 확인·안전한 교체·fork·삭제만 담당한다. 빌드와
  Node·PM2·systemd·tmux 재시작은 운영자가 명시적으로 수행한다.
- Market update는 영수증과 현재 파일이 완전히 같을 때만 허용하고, 새 패키지 검증 뒤 실제 전환 직전
  다시 검사한다. `--force`, downgrade와 자동 병합은 제공하지 않는다.
- 수정한 Market 설치본은 `fork OLD NEW`로 사이트 소유 스킨에 분리하고 원본 key·version을 남긴다.
- checksum은 무결성만 증명한다. Vue 스킨의 제작자·소스 신뢰와 검토는 별도 문제다.
- 스킨은 다른 스킨 폴더를 import하지 않는다. 공유 경계는 provider·store·타입과 플랫폼 공통 UI다.
- API contract v1 application 오류는 HTTP 200 + `success=false`를 유지하고 status 의미 변경은 v2에서 다룬다.
- ESLint 오류는 릴리스를 차단하고 기존 optional prop 46건과 `v-html` 4건은 경고 상한 50건으로 동결한다.
- 결제·커미션·구매 권한과 고급 리뷰 남용 방지는 제품 이용이 생기기 전까지 제외한다.

## Open findings

- Mac 작업 트리에 `package-lock.json`의 플랫폼별 optional dependency 1,025줄 제거 변경과, 2026-08-14
  시점의 폐기된 로컬 상태판 `PROJECT_STATUS.md`가 미추적으로 남아 있다. 둘 다 이번 인수 점검에서는
  사용자 변경으로 보존했으며 의도를 확인하기 전 커밋하지 않는다.
- `nubo download`가 내려받을 GOAPI는 임의의 최신 버전이 아니라 현재 NUBO checkout의 contract와 맞는
  공식 Ubuntu 22.04 amd64 artifact여야 한다. checkout 수정 중 contract가 달라질 때의 선택·경고 규칙을
  새 CLI 계약에서 확정해야 한다.
- sensta.me `photo`의 활성 게시글 UID 767에서 첨부 파일 UID 826의 원본 한 경로가 이미 누락돼 있어
  표시 상태와 복구 필요성을 별도 확인해야 한다.
- sensta.me 소스 checkout의 의도된 사이트 스킨 변경과 서버 npm 실행으로 보이는 `package-lock.json`
  변경을 다음 source update 전에 구분·정리해야 한다.
- Market 제작자 신원 확인, token 전달·복구와 운영자 SSO는 현재 수동 절차다.
- Market 제출 단계의 공용 Tiptap 사용 자동 검사는 후속 작업이다.
- 원본 이미지 스트리밍 토큰은 GOAPI 메모리에만 2분간 보관하므로 재시작 시 새 URL을 발급받아야 한다.

## Recent completion

- 2026-08-30 Mac 복귀 점검에서 NUBO `main`과 `origin/main`이 `78dbff3`으로 일치함을 fetch 뒤
  확인하고, v1.2.19 이후 커밋과 현재 상태 문서를 대조했다. 현행 기준 상태판은 이 파일이며 루트의
  미추적 `PROJECT_STATUS.md`는 8월 14일의 과거 스냅샷이다.
- Mac의 GOAPI checkout이 `/Users/sirini/github/goapi.git`에 있고 깨끗한 `main`·`origin/main`이
  `9617087`로 일치함을 확인했다.
- sensta.me의 사이트·업로드를 보존하고 journal·개발 캐시·비활성 도구/Snap·구형 NUBO 릴리스와
  중복 swap 파일을 정리해 18,928,062,464바이트를 회수했다. journal 영구 상한은 512MiB로 두었다.
- sensta.me `news`에서 현재 `status=-1`인 게시글 7,124건의 첨부 원본·썸네일 파일을
  DB 레코드는 유지한 채 물리 정리했다. 실제 파일 16,653개를 제거해 609,669,120바이트를 회수했다.
- TSBOARD v1.3.0의 Reddit형 정보 밀도를 NUBO에 맞게 발전시킨 독립 `nubo-advance-home` 0.1.0을
  추가했다. 통합 피드·게시판 레일·좋아요·검색·추가 로딩과 전체화면 미디어 감상을 제공한다.
- sensta.me `news`의 구형 자동 번역 코호트 6,368건을 복구 가능한 백업 뒤 `status=-1`로 소프트
  삭제하고, 현재 품질 기준으로 작성한 Newsta 글 16건은 유지했다.
- v1.3.0을 GitHub Actions로 빌드·검증해 Linux amd64 archive와 SHA-256을 공개 Release에 게시했다.
- 설명이 없는 기존 첨부 이미지를 집계하고 Luna 예상 비용·개인정보·DB 쓰기를 안내한 뒤 `진행` 확인 후
  한 건씩 저장하는 재실행 안전 Python 백필 도구를 추가하고 다음 공식 릴리스 구성에 포함했다.
- GPT-5.6 Luna의 한국어 평문 이미지 설명과 검색어를 500자 이내로 저장하고, advance/basic gallery의
  현재 사진에 AI 설명을 표시하며 이미지 설명 검색으로 연결했다.
- 이미지 설명 개수 조회 SQL의 게시물 상관관계를 수정해 `해변`, `노을` 같은 설명 단어가 목록과
  전체 개수에 일관되게 반영되도록 했다.
- 존재하지 않는 태그도 SQL 문법 오류 없이 빈 결과를 반환하고 `#태그` 입력도 검색하도록 GOAPI를
  수정했다.
- advance gallery 0.2.1은 큰 화면에서 사진을 유지한 채 우측 상세 패널 안에서 본문·해시태그·댓글을
  스크롤하며, 해시태그 검색 링크와 outline 목록 보기 버튼을 제공한다.
- 제품 소유자가 v1.3.0 구현 결과를 검토하고 공식 태그와 Linux amd64 asset 게시를 승인했다.
- NUBO/GOAPI v1.2.30을 게시하고 sensta.me의 site release에서 readiness와 nuboctl status를 확인했다.
- 기본 board/blog/gallery/trade와 advance blog/gallery를 독립 스킨으로 정리하고 Market에 공개했다.
- 게시판 편집기를 플랫폼 공용 `NuboTiptapEditor`로 통합했다.
- 제한망 공식 bundle 반입을 위한 `server:manual`과 Source Mode 수동 실행 경로를 추가했다.
- Market 제작자 제출·심사, 리뷰·별점과 운영자 숨김·복원을 운영 반영했다.
- 권한 재검사형 원본 이미지 스트림과 advance gallery·blog를 운영 반영했다.

## Verification

- Mac mini 환경은 macOS 27.0 arm64, Node.js 24.11.1, npm 11.19.0이며 프로젝트의 Node.js 22+
  요구사항을 충족한다. `git diff --check`가 통과했고 fetch 뒤 `main...origin/main` 차이는 0/0이다.
- 서버 정리 뒤 루트 파일시스템 가용 공간은 8,872,718,336바이트에서 27,800,780,800바이트로 늘고
  사용률은 81%에서 40%로 낮아졌다. `/var/www/sensta.me` 8,115,499,008바이트와 `upload`
  6,708,236,288바이트·3,469파일은 작업 전후 동일하며 GOAPI·웹 프로세스와 HTTPS 200을 확인했다.
  LVM swap 3.7GiB, NUBO `current`·`previous` 릴리스와 활성 Snap만 보존된 것도 재확인했다.
- 정리 후보 16,695경로에서 비대상 DB 레코드와 공유되는 경로·업로드 루트 이탈·심볼릭 링크·관계
  불일치가 모두 0건임을 선검증했다. 기존 누락 42경로 외 실제 파일 16,653개를 오류 없이 삭제했고,
  후보 잔존은 0건이며 활성 `news` 첨부 45경로는 모두 보존됐다. 감사 목록은
  `/var/backups/sensta-news-status-minus1-attachments-20260829-025531.tsv.gz`에 두었고 SHA-256은
  `952f99e34f3fcf442cde26ca6cd3e3fa0abaac2327fc921be37fa428f698d7d6`이다.
- `nubo-advance-home` manifest 등록·독립성·전체화면 키보드 UX 회귀를 포함한 Vitest 64건,
  typecheck, lint 오류 0건(기존 경고 50)과 1536 MiB production build가 통과했다.
- GOAPI에서 `status=-1`이 목록·검색·홈·직접 보기에서 제외됨을 코드와 운영 API로 재확인했다.
  정리 뒤 `news` 공개 목록은 보존한 16건만 반환하며 구형 글 직접 조회와 중국어 검색도 노출되지 않는다.
- 운영 백업 `/var/backups/sensta-news-legacy-soft-delete-20260829-021444.sql`은 6,368건을 포함하며
  SHA-256은 `f90cd3a058162eb94ae9ad5002d96e343de46181a5932992caeb27453f7ca467`이다.
- 백필 도구 Python 단위 테스트 7건, release shell 문법·설치 smoke와 실제 로컬 DB `--scan-only`가
  통과했으며 스캔 중 API 호출과 DB 변경은 없었다. NUBO Vitest 61건, lint 오류 0건과 typecheck도 통과했다.
- 실제 `.env` 설정으로 GPT-5.6 Luna를 호출해 144자 완결 설명과 `해안, 해변, 폭포, 산, 바다` 등
  검색어가 생성되는 것을 확인했다(키는 출력하지 않음).
- 이미지 설명 정규화·500자 제한·`해변` 목록 검색·`노을` 개수 검색 회귀 테스트를 포함한 GOAPI
  전체 `go test ./...`와 `go vet ./...`가 통과했다.
- AI 설명 표시·검색 계약을 포함한 NUBO Vitest 61건, lint 오류 0건(기존 경고 50), typecheck와
  production build가 통과했다.
- GOAPI v1.3.0 commit `9617087`은 이미지 설명 저장·검색 회귀 테스트를 포함한 전체
  `go test ./...`와 `go vet ./...`를 통과해 `main`에 푸시했다.
- GitHub self-hosted release runner는 별도 Actions 검증에서 checkout·용량·Docker 검사를 통과했다.
- v1.3.0 Actions는 통합 빌드와 Ubuntu 22.04·24.04 fresh-install, Release 게시를 통과했다. 공개 archive를
  다시 내려받아 SHA-256과 manifest의 NUBO `911dec7`·GOAPI `9617087`, 이미지 설명 백필 도구를 확인했다.
- `nuboctl update`가 사용하는 릴리스 descriptor·checksum 경로로 공개 v1.3.0 archive를 정상 해석했다.
- nuboctl Market update·diff·fork, 독립 실행명, apply와 설치 링크 변경은 전체 Go test와 vet를 통과했다.
- NUBO 전체 Vitest 59건, lint 오류 0건(기존 경고 50), typecheck와 1536 MiB production build가 통과했다.
- API contract v1, prebuilt smoke와 `server:stage`·Source Mode Market 링크 단위 계약이 통과했다.
- 통합 bundle은 GOAPI 공식 Ubuntu 22.04 빌드, 구형 x86-64·x86-64-v2 libvips, Ubuntu 24.04 링크,
  nuboctl 0.15.0, nubo-market 0.1.0, 내부 checksum과 Nuxt prebuilt smoke를 통과했다.

## Next action

1. 단일 `nubo` CLI의 bootstrap, `download`, self-`update`, `install skin/<key>` 계약과 v1.2 호환 종료
   방식을 합의한다.
2. 로컬 `package-lock.json`과 루트 `PROJECT_STATUS.md`의 보존·정리 의도를 제품 소유자와 확인한다.
3. 테스트 사이트의 관리자 스킨 화면에서 `nubo-advance-home`을 선택해 데스크톱·모바일 피드와
   전체화면 미디어, 로그인·좋아요 동작을 시각 QA한다.
4. 범용 홈 스킨으로 배포할 경우 0.1.0 패키지를 NUBO Market 제출·심사한다.
