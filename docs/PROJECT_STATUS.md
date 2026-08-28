# NUBO project status

## Active goal

- nubo-advance-gallery 0.2.1과 GOAPI 태그 검색 수정본을 업무 사이트에서 운영 검증한다.
- 공개 v1.3.0 asset의 초기 설치·업데이트 결과와 운영 피드백을 계속 관찰한다.

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

- GOAPI 태그 검색 회귀 테스트를 포함한 전체 `go test ./...`와 `go vet ./...`가 통과했다.
- advance gallery 변경은 Vitest 60건, lint 오류 0건(기존 경고 50), typecheck와 production build를
  통과했다.
- GOAPI v1.3.0 commit `df9a973`은 전체 `go test ./...`와 `go vet ./...`를 통과해 `main`에 푸시했다.
- nuboctl Market update·diff·fork, 독립 실행명, apply와 설치 링크 변경은 전체 Go test와 vet를 통과했다.
- NUBO 전체 Vitest 59건, lint 오류 0건(기존 경고 50), typecheck와 1536 MiB production build가 통과했다.
- API contract v1, prebuilt smoke와 `server:stage`·Source Mode Market 링크 단위 계약이 통과했다.
- 통합 bundle은 GOAPI 공식 Ubuntu 22.04 빌드, 구형 x86-64·x86-64-v2 libvips, Ubuntu 24.04 링크,
  nuboctl 0.15.0, nubo-market 0.1.0, 내부 checksum과 Nuxt prebuilt smoke를 통과했다.
- 이번에 수정·추가한 코드 파일은 기능 변경 없는 최종 분리 뒤 모두 300줄 이하다.

## Next action

1. 업무 사이트에 GOAPI 수정본과 advance gallery 0.2.1을 반영해 태그 검색, 큰 화면 우측 스크롤과
   댓글 작성 흐름을 확인한다.
2. 운영 QA 뒤 advance gallery 0.2.1 패키지를 Market에 제출·승인한다.
3. sensta.me의 사이트 스킨과 `package-lock.json` 변경은 운영 source update 전에 별도로 정리한다.
