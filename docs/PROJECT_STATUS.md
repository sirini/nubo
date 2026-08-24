# NUBO project status

## Active goal

- sensta.me 복구를 막는 nuboctl의 Nginx 소유권 침범과 실패한 커스텀 릴리스 누적을 수정해 배포한다.

## Product boundary

- NUBO는 사진 커뮤니티·블로그·게시판에 재사용하는 미디어 중심 커뮤니티 빌더다.
- 현재 대상은 직접 서버를 관리하는 한국어권 개인·소규모 커뮤니티다.
- 공식 prebuilt는 Ubuntu 22.04+ amd64, Node.js 22+, systemd, Nginx, MySQL/MariaDB 단일 서버를 지원한다.
- 컨테이너·Kubernetes·다중 배포판과 Certbot/TLS, 외부 DB·메일 제공자 설치 검증은 현재 범위가 아니다.
- DB·업로드와 Market DB·패키지의 백업·복원·보존 정책은 배포 환경 운영자 책임이며 NUBO가 자동 수행하지 않는다.

## Current decisions

- NUBO와 GOAPI는 릴리스 전 machine-readable API contract version을 일치시킨다.
- NUBO와 GOAPI는 하나의 통합 제품으로 배포하므로 공개 버전을 1.2.26부터 동일하게 맞춘다. 실제 소스 조합은 릴리스 manifest의 두 commit으로 계속 고정한다.
- 다음 통합 릴리스는 NUBO/GOAPI 1.2.27이며 공용 Tiptap을 사용하는 공식 게시판 스킨의 최소 NUBO 버전도 1.2.27이다.
- 공식 릴리스는 고정 GOAPI commit, Nuxt prebuilt, `nuboctl`, 두 libvips 변형과 SHA-256을 하나의 Linux amd64 asset으로 묶는다.
- 공식 GOAPI 바이너리는 GOAPI의 `./scripts/build-ubuntu22.sh`로만 만든다.
- 운영 서버는 불변 릴리스와 `current` 링크를 사용한다. 설정·업로드·사이트 전용 스킨은 릴리스 밖에 보존한다.
- Nginx와 TLS는 운영자 소유다. nuboctl install은 `/etc/nginx`를 읽거나 생성·수정·활성화·reload하지 않는다.
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
- 게시글·댓글의 Tiptap 구현과 도구막대·표·링크·본문 이미지 기능은 플랫폼이 소유하며 스킨은 `NuboTiptapEditor`를 사용한다.
- 데스크톱 활성 링크·버튼·메뉴·선택 컨트롤은 손가락 커서, 비활성 컨트롤은 금지 커서를 사용한다.
- 초기 리뷰는 nubohub.org 로그인 사용자에게 열고 계정당 스킨별 1개로 제한한다. 설치 여부와 제작자 본인 여부는 검사하지 않는다.
- 리뷰 인증은 NUBO Web이 `uid`·닉네임·관리자 여부만 Market에 제공하고 Market은 로그인 토큰을 저장하지 않는다. 별점은 1~~5, 본문은 10~~2000자이며 숨김 리뷰는 집계에서 제외한다.
- 초기 리뷰 관리는 영구 삭제 대신 운영자 숨김·복원만 제공한다. 사용자가 숨김 리뷰를 수정해도 자동 공개하지 않는다.
- 기존 `nubo-basic-blog`·`nubo-basic-gallery`는 호환 기준선으로 유지하고 신규 `nubo-advance-blog`·`nubo-advance-gallery`를 독립 스킨으로 개발한다.
- advance 블로그는 Medium의 읽기 흐름, advance 갤러리는 Unsplash의 정갈한 목록과 500px의 집중 감상 흐름에서 영감을 받되 `nubo-basic-layout`의 웜톤 라이트·다크 색상 체계를 계승한다.
- advance 갤러리의 미리보기를 누르면 전체 화면에서 원본 이미지를 지연 로드하고 닫기·배경 클릭·Esc로 돌아온다. 원본은 직접 파일 URL이 아니라 게시물 조회 권한을 재검사하는 GOAPI 경로로 제공한다.
- 원본 이미지 API는 보기 레벨·포인트 잔액, 비밀글, 삭제글, 작성자 차단과 file–board 소유권을 검사하되 보기 포인트를 다시 차감하지 않는다. 실제 저장 경로는 게시글 JSON에서도 숨기고, 2분짜리 토큰 스트림은 인라인 표시와 byte range를 지원한다.
- 결제·커미션·구매 권한은 제품이 자리 잡을 때까지 목표에서 제외한다.
- 현재 `rolldown-vite@7.3.1`이 저사양 서버에서도 동작하므로 Vite 8 전환은 안정성과 실익이 분명할 때까지 보류한다.

## Recent completion

- nuboctl 0.14.2에서 install의 Nginx 파일 생성·충돌 검사·활성화 명령을 제거하고, update/customize의 미적용 공식·사이트 후보를 current/previous 보호 뒤 자동 정리하도록 수정했다.
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
- `nubo-advance-gallery`가 목록·상세·작성·수정 엔트리를 모두 자체 소유하도록 추가하고 웜톤 masonry 목록, 권한 확인형 원본 전체화면, 화면 맞춤·1:1과 독립 편집 화면을 구현했다.
- advance gallery 0.2.0에 댓글 작성·답글·수정·삭제, 기존 첨부 미리보기·삭제, 모바일 스와이프와 뷰어 포커스·상태 안내를 추가했다. 댓글 요청 실패 시 입력을 보존하고 화면 댓글 수를 즉시 동기화한다.
- `nubo-advance-blog` 0.1.0을 독립 네 라우트로 추가했다. 대표 글과 에디토리얼 피드, 좁은 본문·넓은 표지·읽기 진행률·목차, 코드 복사, 댓글 관리와 큰 제목 중심 리치 편집 흐름을 제공한다.
- NUBO와 GOAPI 공개 버전을 1.2.26부터 통일하고 exact commit manifest를 유지하는 통합 릴리스 정책을 확정했다.
- NUBO/GOAPI v1.2.26 태그와 통합 asset을 게시하고 `nuboctl update`로 nubohub.org의 공식 런타임과 커스텀 Web을 갱신했다.
- 직접 게시판 관리 경로에서 비동기 그룹 로딩 전 UID 0을 저장하던 회귀를 수정했다. 폼은 게시판의 `config.groupUid`를 사용하고 GOAPI는 존재하지 않는 그룹과 게시판 ID–UID 불일치를 거부한다.
- DB 부트스트랩은 기존 사이트의 첫 그룹을 재사용하고 그룹이 하나도 없을 때만 `boards`를 생성하도록 수정했다.
- advance 블로그 진행률을 viewport 최상단에 고정하고 두 advance 스킨의 수정 링크를 실제 `/edit` 라우트로 바로잡았다. 갤러리 본문 탐색 버튼을 키우고 1:1 원본에 중앙 시작·스크롤·마우스 드래그 패닝을 추가했다.
- `body`에서 가변 폰트의 `wght` 축을 400으로 고정하던 선언을 제거해 한글의 `font-weight`가 Pretendard 가변축에 정상 반영되도록 했다.
- 제한망에서 외부 반입한 공식 bundle과 SHA-256을 다단계 검증해 `.nubo/releases`와 `./goapi-linux`를 준비하는 `server:manual`을 추가하고, `.env`를 명시한 GOAPI·Nuxt 수동 실행 절차를 README에 문서화했다.
- Nuxt `app.baseURL` 기본값과 `%s` 제목 템플릿을 명시하고, 실행 시 `NUXT_APP_BASE_URL=/sample/`이면 브라우저 API·원본·다운로드와 nuboctl 상태 확인도 같은 하위 경로를 따르도록 했다.
- 기본 board/blog/gallery/trade와 advance blog/gallery의 게시글 작성·수정, 기본 스킨 댓글 편집기를 플랫폼 공용 `NuboTiptapEditor`로 통합했다. 스킨 내부 Tiptap 복제본을 제거하고 표·링크·이미지·Markdown 기능과 제작자 사용 계약을 공용화했다.
- NUBO/GOAPI v1.2.27 통합 릴리스와 상세 변경 노트를 게시하고, 공용 Tiptap 기반 기본 게시판 스킨 4종의 새 버전과 advance 스킨 2종의 최초 버전을 운영 Market에 공개했다.

## Open findings

- Market 운영자 세션은 NUBO 관리자 세션과 분리돼 최초 진입에 `MARKET_ADMIN_TOKEN`이 필요하다. 짧은 수명의 서명 코드 교환은 필수가 아닌 후속 UX 개선 후보다.
- 제작자 신원 확인과 token 전달·복구는 현재 운영자 수동 절차다. 실제 이용이 생기기 전에는 이메일 복구나 외부 OAuth를 추가하지 않는다.
- 리뷰의 설치 증명·제작자 제한·고급 남용 방지는 실제 남용이 관찰될 때 검토한다.
- Market의 리뷰 작성은 NUBO Web 내부 사용자 확인 API에 의존한다. 확인 API 장애 시 공개 조회는 유지하고 작성·수정만 일시 중단한다.
- 원본 이미지 스트리밍 토큰은 GOAPI 메모리에만 2분간 보관하므로 프로세스 재시작 시 열린 뷰어가 새 URL을 다시 발급받아야 한다. 단일 서버 현재 범위에는 별도 공유 저장소를 두지 않는다.
- Market 제출 단계에서 게시판 스킨의 공용 Tiptap 사용을 자동 검사하는 정책은 후속 작업이다.
- 설치된 Market 패키지를 영수증 검증과 안전한 교체로 갱신하는 `nuboctl market update`는 후속 작업이다.

## Verification

- Nginx 비관리·실패 릴리스 정리 패치는 nuboctl 전체 Go test/vet, NUBO unit 47건, ESLint 오류 0건(기존 경고 50), Linux amd64 nuboctl 0.14.2 빌드와 Node/Bash 구문 검사를 통과했다.
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
- advance gallery 0.2.0은 manifest·네 라우트 독립성 Nuxt 테스트 7건, unit 31건, typecheck, ESLint 오류 0건(기존 경고 50)과 `NODE_OPTIONS=--max-old-space-size=1536` production build를 통과했다.
- 두 advance 스킨 동시 포함 상태는 네 라우트 독립성 Nuxt 테스트를 포함한 Nuxt 8건, unit 31건, typecheck, ESLint 오류 0건(기존 경고 50)과 `NODE_OPTIONS=--max-old-space-size=1536` production build를 통과했다.
- NUBO/GOAPI v1.2.26은 로컬 NUBO 39건, lint 오류 0건(경고 50), typecheck, 1536 MiB production build와 GOAPI test/race/vet를 통과했다. CI run `32643934402`에서 공식 Ubuntu 빌드와 Ubuntu 22.04/24.04 fresh install 뒤 asset 2개를 게시했다.
- 운영 전 백업은 `/var/backups/nubohub-nubo-pre-v1.2.26-20260823-225940.sql.gz`, `/var/backups/nubohub-upload-pre-v1.2.26-20260823-225940.tar.gz`와 SHA-256 영수증에 보존했다.
- nubohub.org는 커스텀 릴리스 `e169646e59d6`(로컬 빌드 `f156b3639620`)에서 `nuboctl status` 16건, `/version`의 NUBO·GOAPI 1.2.26 exact commit, HTTPS와 readiness를 통과했다. 원본 API는 더 이상 404가 아니며 실제 JPEG byte range에 206을 반환했다.
- 게시판 그룹 회귀 패치는 NUBO unit 40건, typecheck, ESLint 오류 0건(기존 경고 50), 1536 MiB production build와 GOAPI 전체 test/race/vet를 통과했다.
- advance 스킨 UX 패치는 unit 36건, typecheck, ESLint 오류 0건(기존 경고 50)과 1536 MiB production build를 통과했다.
- Pretendard 굵기 패치는 공식 GOV 1.3.9 variable과 기존 파일의 45~~920 축을 비교해 파일 문제가 아님을 확인했고, unit 37건, typecheck, ESLint 오류 0건(기존 경고 50)과 1536 MiB production build를 통과했다.
- `server:manual`은 unit 39건과 ESLint 오류 0건(기존 경고 50)을 통과했고, 로컬 NUBO 1.2.26 공식 asset으로 외부 SHA-256·압축 경로·manifest·내부 checksum 검증과 `goapi-linux` 준비를 실제 완료했다.
- 하위 경로 패치는 NUBO 전체 50건, typecheck, ESLint 오류 0건(기존 경고 50), nuboctl 전체 Go test와 1536 MiB production build를 통과했다. 기본 빌드를 런타임 `/sample/`로 실행해 SSR·정적 asset·`/sample/api` 프록시와 readiness를 검증했다.
- 공용 에디터 전환은 전체 Vitest 53건, typecheck, ESLint 오류 0건(기존 경고 50)과 1536 MiB production build를 통과했다.
- NUBO/GOAPI v1.2.27은 로컬 NUBO 전체 53건, lint 오류 0건(경고 50), typecheck, 1536 MiB production build와 GOAPI 전체 test/race/vet를 통과했다. CI run `32755181797`에서 공식 Ubuntu 빌드, Ubuntu 22.04/24.04 fresh install과 asset·릴리스 노트 게시를 완료했다.
- Market의 기본 board 0.2.1, blog 0.1.2, gallery 0.1.2, trade 0.1.4와 advance blog 0.1.0, gallery 0.2.0은 모두 최소 NUBO 1.2.27, Registry·다운로드·재현 archive SHA-256 일치를 확인했다.

## Next action

1. Nginx 비관리 hotfix를 공식 통합 릴리스로 게시하고 sensta.me의 NUBO 서비스를 복구한다.
2. 제품 소유자가 기본·advance 스킨에서 새 글, 기존 HTML 글 수정, 표·본문 이미지·링크와 댓글 편집을 브라우저 QA한다.
3. Market 제출 시 게시판 스킨의 공용 Tiptap 사용 검사와 `nuboctl market update`, sensta.me 게시판 그룹 정리는 후속 작업으로 진행한다.
