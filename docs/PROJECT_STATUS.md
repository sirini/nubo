# NUBO project status

## Active goal

- 공개 v1.3.0 asset의 sensta.me `nuboctl update` 결과와 초기 운영 피드백을 관찰한다.
- GPT-5.6 Luna 이미지 설명 백필과 설명 표시·검색을 업무 사이트에서 운영 검증한다.

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

- sensta.me 소스 checkout의 의도된 사이트 스킨 변경과 서버 npm 실행으로 보이는 `package-lock.json`
  변경을 다음 source update 전에 구분·정리해야 한다.
- Market 제작자 신원 확인, token 전달·복구와 운영자 SSO는 현재 수동 절차다.
- Market 제출 단계의 공용 Tiptap 사용 자동 검사는 후속 작업이다.
- 원본 이미지 스트리밍 토큰은 GOAPI 메모리에만 2분간 보관하므로 재시작 시 새 URL을 발급받아야 한다.

## Recent completion

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

1. sensta.me에서 `nuboctl update --dry-run`과 실제 update를 차례로 실행한다.
2. 백필 도구를 `--scan-only`로 실행해 대상·예상 비용을 확인한다.
3. 외부 DB 백업 뒤 `--limit 10`으로 처리하고 설명 표시와 `해변`, `노을` 검색을 확인한다.
4. 운영 QA 뒤 advance gallery 0.2.2 패키지를 Market에 제출·승인한다.
