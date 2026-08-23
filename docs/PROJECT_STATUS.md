# NUBO project status

## Active goal

- 로그인 기반 스킨 리뷰·별점의 운영 QA를 마쳤다. 권한 확인형 원본 이미지 스트리밍 계약과 `nubo-advance-gallery` 0.1.0 골격을 구현했으며 실제 콘텐츠 QA로 목록·뷰어·편집 흐름을 다듬는다.

## Product boundary

- NUBO는 사진 커뮤니티·블로그·게시판에 재사용하는 미디어 중심 커뮤니티 빌더다.
- 현재 대상은 직접 서버를 관리하는 한국어권 개인·소규모 커뮤니티다.
- 공식 prebuilt는 Ubuntu 22.04+ amd64, Node.js 22+, systemd, Nginx, MySQL/MariaDB 단일 서버를 지원한다.
- 컨테이너·Kubernetes·다중 배포판과 Certbot/TLS, 외부 DB·메일 제공자 설치 검증은 현재 범위가 아니다.
- DB·업로드와 Market DB·패키지의 백업·복원·보존 정책은 배포 환경 운영자 책임이며 NUBO가 자동 수행하지 않는다.

## Current decisions

- NUBO와 GOAPI는 릴리스 전 machine-readable API contract version을 일치시킨다.
- 공식 릴리스는 고정 GOAPI commit, Nuxt prebuilt, `nuboctl`, 두 libvips 변형과 SHA-256을 하나의 Linux amd64 asset으로 묶는다.
- 공식 GOAPI 바이너리는 GOAPI의 `./scripts/build-ubuntu22.sh`로만 만든다.
- 운영 서버는 불변 릴리스와 `current` 링크를 사용한다. 설정·업로드·사이트 전용 스킨은 릴리스 밖에 보존한다.
- 공개 update는 `git pull --ff-only`를 기본으로 하며 사이트 스킨은 `nuboctl customize`로 별도 파생 릴리스를 만든다.
- 커스텀 Web 빌드는 Node heap 1536 MiB를 기본 적용하되 운영자가 지정한 `NODE_OPTIONS`를 우선 보존한다.
- advance 스킨 추가만으로 기본 heap을 선제 상향하지 않는다. 운영 `nuboctl customize`에서 실제 메모리 부족이 확인되면 서버 여유 메모리와 peak 사용량을 확인한 뒤 `NODE_OPTIONS=--max-old-space-size=<MiB>`로 상향한다.
- 릴리스 정리는 `releases prune --dry-run` 확인 뒤 실행하며 current·previous·공식 기반·최신 예비를 보호한다.
- API contract v1의 application 오류는 HTTP 200 + `success=false`를 유지하고 HTTP status 의미 변경은 v2에서 다룬다.
- ESLint 오류는 릴리스를 차단하고 기존 optional prop 46건과 `v-html` 4건은 경고 상한 50건으로 동결한다.
- NUBO Market은 비공개 `sirini/nubohub-market` 저장소의 독립 Go Fiber 서비스로 운영한다.
- Market 패키지는 immutable key/version, Registry SHA-256과 안전한 단일 `<key>/` tar.gz를 계약으로 삼는다.
- `nuboctl market install`은 checksum 영수증을 남기고, `market remove`는 영수증과 파일이 모두 일치할 때만 삭제한다.
- 제작자는 운영자가 발급한 token으로 로그인한다. 승인된 key 소유자만 버전을 제출하고 운영자 승인 전에는 공개하지 않는다.
- Market 런타임 DB 계정에는 DDL 권한을 주지 않으며 schema 변경은 관리자 계정으로 선적용한다.
- 스킨은 다른 스킨 폴더의 소스를 import하지 않는다. 공유 경계는 provider·store·타입과 플랫폼 공통 UI다.
- 데스크톱 활성 링크·버튼·메뉴·선택 컨트롤은 손가락 커서, 비활성 컨트롤은 금지 커서를 사용한다.
- 초기 리뷰는 nubohub.org 로그인 사용자에게 열고 계정당 스킨별 1개로 제한한다. 설치 여부와 제작자 본인 여부는 검사하지 않는다.
- 리뷰 인증은 NUBO Web이 `uid`·닉네임·관리자 여부만 Market에 제공하고 Market은 로그인 토큰을 저장하지 않는다. 별점은 1~5, 본문은 10~2000자이며 숨김 리뷰는 집계에서 제외한다.
- 초기 리뷰 관리는 영구 삭제 대신 운영자 숨김·복원만 제공한다. 사용자가 숨김 리뷰를 수정해도 자동 공개하지 않는다.
- 기존 `nubo-basic-blog`·`nubo-basic-gallery`는 호환 기준선으로 유지하고 신규 `nubo-advance-blog`·`nubo-advance-gallery`를 독립 스킨으로 개발한다.
- advance 블로그는 Medium의 읽기 흐름, advance 갤러리는 Unsplash의 정갈한 목록과 500px의 집중 감상 흐름에서 영감을 받되 `nubo-basic-layout`의 웜톤 라이트·다크 색상 체계를 계승한다.
- advance 갤러리의 미리보기를 누르면 전체 화면에서 원본 이미지를 지연 로드하고 닫기·배경 클릭·Esc로 돌아온다. 원본은 직접 파일 URL이 아니라 게시물 조회 권한을 재검사하는 GOAPI 경로로 제공한다.
- 원본 이미지 API는 보기 레벨·포인트 잔액, 비밀글, 삭제글, 작성자 차단과 file–board 소유권을 검사하되 보기 포인트를 다시 차감하지 않는다. 실제 저장 경로는 게시글 JSON에서도 숨기고, 2분짜리 토큰 스트림은 인라인 표시와 byte range를 지원한다.
- 결제·커미션·구매 권한은 제품이 자리 잡을 때까지 목표에서 제외한다.
- 현재 `rolldown-vite@7.3.1`이 저사양 서버에서도 동작하므로 Vite 8 전환은 안정성과 실익이 분명할 때까지 보류한다.

## Recent completion

- NUBO v1.2.25와 nuboctl 0.14.1을 상세 릴리스 노트로 게시하고 nubohub.org에 운영 반영했다.
- 게시판·블로그·갤러리·중고거래 기본 스킨의 상호 소스 의존성을 제거하고 독립 Market 패키지로 게시했다.
- 각 기본 스킨에 provider 변수·함수, 구성 요소 지도와 복사·확장 절차를 설명하는 주석과 README를 추가했다.
- nuboctl에 안전한 릴리스 list/prune, Market search/info/install/remove와 1536 MiB customize heap 기본값을 추가했다.
- Market 제작자 token 로그인·프로필·key 요청·패키지 제출·심사 이력과 운영자 계정·key·버전 검토 UI를 운영 반영했다.
- 제작자 게시 흐름을 운영 리허설해 승인 전 차단, 공개 전 비노출, 승인 후 다운로드 원본과 checksum을 검증했다.
- NUBO와 Market의 활성 인터랙션 커서를 전수 보완하고 실제 운영 CSS까지 확인했다.
- Chrome의 same-origin 폼이 opaque Origin을 보내던 운영자 로그인 호환성 문제를 `3deff6c`에서 수정했다.
- 검수를 마친 `nubo-rehearsal-skin@1.0.0`의 공개 버전·제출·key 소유권·패키지 파일을 운영 Market에서 제거했다. 별도 `nubo-rehearsal` 제작자 계정은 유지했다.
- 로그인 기반 스킨 리뷰·별점, 계정·스킨별 단일 리뷰 upsert와 운영자 숨김·복원을 구현하고 NUBO·Market `main` 및 nubohub.org에 반영했다.
- 제품 소유자가 운영에서 리뷰 작성·수정, 별점과 관련 흐름이 의도대로 동작함을 최종 확인했다.
- `nubo-advance-gallery`가 목록·상세·작성·수정 엔트리를 모두 자체 소유하도록 추가하고 웜톤 masonry 목록, 원본 전체화면, 화면 맞춤·1:1, 키보드 탐색과 독립 편집 화면을 구현했다.

## Open findings

- Market 운영자 세션은 NUBO 관리자 세션과 분리돼 최초 진입에 `MARKET_ADMIN_TOKEN`이 필요하다. 짧은 수명의 서명 코드 교환은 필수가 아닌 후속 UX 개선 후보다.
- 제작자 신원 확인과 token 전달·복구는 현재 운영자 수동 절차다. 실제 이용이 생기기 전에는 이메일 복구나 외부 OAuth를 추가하지 않는다.
- 리뷰의 설치 증명·제작자 제한·고급 남용 방지는 실제 남용이 관찰될 때 검토한다.
- Market의 리뷰 작성은 NUBO Web 내부 사용자 확인 API에 의존한다. 확인 API 장애 시 공개 조회는 유지하고 작성·수정만 일시 중단한다.
- 원본 이미지 스트리밍 토큰은 GOAPI 메모리에만 2분간 보관하므로 프로세스 재시작 시 열린 뷰어가 새 URL을 다시 발급받아야 한다. 단일 서버 현재 범위에는 별도 공유 저장소를 두지 않는다.

## Verification

- NUBO v1.2.25는 API contract v1 일치, Vitest 35건, ESLint 오류 0건(기존 경고 50), typecheck·production build와 Ubuntu 22.04/24.04 fresh-install을 통과했다.
- nubohub.org 커스텀 릴리스 `03030eab8c30`(로컬 스킨 빌드 `1b6427b75445`)은 `nuboctl status` 16건을 통과했고 NUBO·GOAPI·Market·Nginx가 active다.
- Market `3deff6c`는 전체 Go test/race/vet와 CI run `32635409940`의 Ubuntu 22.04 빌드·MySQL smoke를 통과했다. 운영 바이너리 SHA-256은 `89fe8762651cceb20d454404e2ed1b2009efd56ac1d152755db9f1307275787f`다.
- 운영 HTTPS에서 opaque Origin의 same-origin 로그인은 303, cross-site는 403임을 실제 운영 token을 노출하지 않고 확인했다.
- 리허설 스킨 제거 뒤 공개 조회 404, 관련 DB 행 0, 패키지 디렉터리 삭제와 Market readiness를 확인했다.
- 리뷰 변경은 NUBO 최소 사용자 계약, 계정·스킨 유니크 upsert, 숨김 상태 보존, 운영자 권한과 CSRF·교차 출처 차단 테스트를 통과했다.
- NUBO의 Market 사용자 계약은 unit test, typecheck와 ESLint 오류 0건(기존 경고 50)을 통과했고 Market은 전체 Go test와 MySQL 8 통합 스모크를 통과했다.
- NUBO `7f0d308`과 Market `2b76a2f`를 `main`에 푸시했다. Market CI run `32637202867`의 Ubuntu 22.04 빌드·MySQL 리뷰 스모크가 통과했고 공식 스크립트 바이너리 SHA-256은 `67586fe898b27a82f0c6c47ec3aaf2936cd4abdb2b6f48ad6120c1fb06f03f3b`다.
- 운영 DB 적용 전 백업은 `/var/backups/nubohub-market-pre-reviews-20260823-205554.sql`, 이전 Market 바이너리는 `/opt/nubohub-market/nubohub-market.pre-reviews-20260823-210239`에 보존했다.
- 운영 `/api/market/user`는 비로그인 요청에 의도한 401 JSON을 반환한다. Market 내부·공개 readiness, 공개 리뷰 API, 상세 리뷰 UI와 비인증 리뷰·운영자 변경 요청의 403 차단을 확인했고 운영 리뷰 데이터는 0건으로 유지했다.
- 원본 이미지 계약은 교차 게시판·비밀글·삭제글·작성자 차단·보기 레벨 회귀 테스트, 저장 경로 비노출 직렬화 테스트와 반복 byte range 스트리밍 테스트를 통과했다. GOAPI 전체 test/race/vet와 NUBO unit 31건, typecheck, ESLint 오류 0건(기존 경고 50), production build를 통과했다.
- advance gallery 추가 뒤 manifest·네 라우트 독립성 Nuxt 테스트 7건, typecheck, ESLint 오류 0건(기존 경고 50)과 production build를 통과했다. 스킨 추가 상태에서도 기본 Node heap 1536 MiB로 로컬 빌드가 완료됐다.

## Next action

1. 실제 갤러리 콘텐츠로 목록 비율, 원본 지연 로드, 화면 맞춤·1:1, 키보드·모바일 탐색과 접근성을 브라우저 QA한다.
2. 댓글 작성·수정과 기존 첨부 삭제를 advance 디자인 안에서 완성하고 스킨 패키지 검증·운영 배포를 준비한다.
3. 갤러리 운영 QA와 필요한 수정 뒤 `nubo-advance-blog`의 Medium 계열 읽기 흐름을 개발한다.
