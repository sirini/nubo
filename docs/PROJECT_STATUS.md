# NUBO project status

## Active goal

- 운영 반영한 Market 제작자 작업실과 운영자 화면을 제품 소유자가 직접 사용하며 검수하고, 피드백을 반영한 뒤 단순한 스킨 리뷰·별점으로 넘어간다.

## Product boundary

- NUBO는 사진 커뮤니티·블로그·게시판에 재사용하는 미디어 중심 커뮤니티 빌더다.
- 현재 운영 대상은 직접 서버를 관리하는 한국어권 개인·소규모 커뮤니티다.
- 공식 prebuilt는 Ubuntu 22.04+ amd64, Node.js 22+, systemd, Nginx, MySQL/MariaDB 단일 서버를 지원한다.
- 컨테이너·Kubernetes·다중 배포판·범용 배포 추상화는 현재 범위가 아니다.
- Certbot/TLS와 외부 DB·메일 제공자의 설치·계정·네트워크 검증, 운영 백업 자동화는 NUBO 솔루션 범위가 아니다.

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
- Market 설치는 package identity와 파일별 SHA-256 영수증을 남긴다. `market remove`는 영수증과 설치 파일이 모두 일치할 때만 삭제하며 `--force`는 제공하지 않는다.
- Market 제작자 계정은 배포 사이트 회원과 분리하며 운영자가 발급한 고엔트로피 토큰의 SHA-256만 저장한다. 승인된 key 소유자만 버전을 제출하고 운영자 승인 전에는 공개하지 않는다.
- 스킨 결제·커미션·구매 권한은 제품이 자리 잡은 뒤 다시 판단하며 현재 목표에서 제외한다. 무료 스킨 리뷰·별점은 제작자 리허설과 관리 UI 이후의 신뢰 기능으로 둔다.
- 초기 스킨 리뷰는 nubohub.org 로그인 사용자에게 열고 설치 여부와 제작자 본인 여부를 검사하지 않는다. 계정당 스킨별 리뷰 1개만 제한하며, 이용이 생기기 전부터 복잡한 증명·남용 방지를 도입하지 않는다.
- 데스크톱의 활성 링크·버튼·메뉴·선택 컨트롤은 손가락 커서를 공통 UX로 사용하고, 비활성 컨트롤은 금지 커서로 구분한다.
- Market 코드 전용 배포에는 바이너리 사본을 매번 추가하지 않는다. 복구에 필요한 DB와 패키지 저장소는 여전히 같은 시점의 데이터 백업 세트로 다룬다.
- Market 런타임 DB 계정에는 DDL 권한을 주지 않는다. additive schema 변경도 관리자 계정으로 선적용한 뒤 새 바이너리를 시작한다.
- 스킨 패키지는 다른 스킨 폴더의 소스 파일을 import하지 않는다. 중복되더라도 각 스킨이 목록·보기·쓰기 UI를 직접 소유하고, 공유 경계는 NUBO의 provider·store·타입과 `app/components`의 플랫폼 UI로 제한한다.
- 분리 전 `nubo-basic-board`를 선택한 기존 블로그·갤러리는 스킨 로더가 각각 전용 기본 스킨으로 연결해 업그레이드 전후 UI를 보존한다.
- 릴리스 정리는 자동 삭제하지 않고 운영자가 `releases prune --dry-run`을 확인한 뒤 실행한다. current·previous·현재 커스텀 빌드의 공식 기반·최신 예비 1개를 보호하고, 삭제 후보도 전체 무결성을 재검증한다.
- 커스텀 Web 빌드는 Node heap 1536 MiB를 기본 적용하되, 운영자가 `NODE_OPTIONS`로 지정한 heap과 다른 옵션을 우선 보존한다.
- DB·업로드와 Market DB·패키지의 백업·복원은 배포 환경별 운영자 책임으로 두고 NUBO가 자동 수행하지 않는다.
- 현재 `rolldown-vite@7.3.1` 빌드가 저사양 서버에서 정상 동작하므로 Vite 8 전환은 안정성과 실익이 분명해질 때까지 추진하지 않는다.

## Recent completion

- NUBO 공통 버튼·링크·폼 컨트롤과 드롭다운·셀렉트 항목, Market의 전체 링크·버튼·폼 컨트롤에 데스크톱 포인터 커서를 적용했다. 게시글 본문의 클릭 이벤트 위임 영역은 실제 링크·이미지가 아닌 본문 전체를 클릭 대상으로 오인시키지 않도록 제외했다.
- Market `1229b14`에 제작자 token 로그인·프로필·key 요청·패키지 제출·심사 이력과 운영자 계정 발급·중지·token 회전·key/버전 검토 화면을 구현해 운영 반영했다.
- 새 Market 화면은 JavaScript 없이 서버 렌더링하며 장기 token을 브라우저에 저장하지 않는다. 2시간 서버 메모리 세션, HttpOnly·Secure·SameSite=Strict cookie, CSRF·Origin 검사와 no-store 응답을 적용했다.
- 제작자·운영자 화면은 작은 영문 장식 문구를 쓰지 않고 한국어 본문·라벨·상태·버튼을 주로 15–16px 이상으로 구성했다. 1440px 데스크톱과 390px 모바일에서 로그인 전·후 레이아웃을 확인했다.
- NUBO v1.2.25와 nuboctl 0.14.1을 상세 릴리스 노트로 공식 게시하고 nubohub.org를 커스텀 Web까지 운영 전환했다.
- nubohub.org에서 외부 `NODE_OPTIONS` 없이 `nuboctl customize --dry-run`을 실행해 1536 MiB 기본 heap, typecheck, client·SSR·Nitro build와 후보 릴리스 준비를 끝까지 확인했다.
- 운영 Market에 첫 제작자 `nubo-rehearsal`과 소유 key `nubo-rehearsal-skin`을 만들고 승인 전 차단, key 승인, 버전 제출, 공개 전 비노출, 최종 승인과 원본 다운로드 검증을 리허설했다. 제작자 토큰은 root 전용 0600 파일로 보관한다.
- 리허설에서 KST MySQL 세션의 TIMESTAMP를 Go가 UTC로 해석해 재조회 시각이 9시간 늦어지는 문제를 발견했다. Market `546a72f`에서 DB 세션과 드라이버를 UTC로 고정하고 운영 반영했다.
- 제품 소유자가 nubohub.org의 블로그·갤러리를 독립 스킨 key로 전환하고 목록·보기·쓰기·수정 화면이 정상 동작함을 확인했다.
- nuboctl 0.14.1이 `customize`와 update의 커스텀 Web 재빌드에 Node heap 1536 MiB 기본값을 자동 적용하도록 보강했다.
- NUBO v1.2.24를 독립 게시판·블로그·갤러리 스킨과 nuboctl 0.14.0의 `releases list/prune`으로 공식 게시하고 nubohub.org에 운영 반영했다.
- 운영 릴리스 20개 중 current·previous·최신 예비 3개를 보존하고, 전체 무결성이 확인된 구버전 17개를 정리해 1.9 GiB를 확보했다.
- nuboctl 0.14.0에 `releases list/prune`과 원자적 `previous` 기록을 추가했다. 정리는 update 잠금과 동일한 경계를 쓰며 manifest·checksum이 불완전하거나 보관함 밖인 대상은 삭제하지 않는다.
- 약 2GB RAM인 nubohub.org에서 Node 기본 heap 한도로 customize typecheck가 실패했으나 `NODE_OPTIONS=--max-old-space-size=1536`으로 v1.2.24 커스텀 Web 빌드·파생 릴리스 적용을 완료했다.
- blog·gallery·trade가 `nubo-basic-board`의 목록·보기·쓰기 컴포넌트를 import하던 숨은 의존성을 제거했다. 각 스킨은 필요한 UI를 자기 폴더에 소유하며 스킨 간 import 금지 테스트로 이 경계를 고정했다.
- 독립 패키지 `nubo-basic-blog@0.1.1`, `nubo-basic-gallery@0.1.1`, `nubo-basic-trade@0.1.3`을 운영 Market에 게시했다.
- 어제까지의 릴리스 자동화·Market·nuboctl·미리보기 작업을 리뷰하고, 기본 게시판 스킨을 `nubo-basic-board@0.2.0`, `nubo-basic-blog@0.1.0`, `nubo-basic-gallery@0.1.0`으로 분리해 운영 Market에 게시했다.
- 각 게시판 계열 스킨에 엔트리 지도, provider 변수·함수 의미, 복사·확장 절차를 설명하는 README와 실제 주석을 추가했다. 블로그·갤러리 대표 이미지는 운영 실화면을 1280×720으로 캡처했다.
- README에서 고정된 과거 버전 표기를 제거하고 NUBO Market의 미리보기→검색→설치→검증·적용→안전한 삭제 흐름과 공식 링크를 프로젝트 첫 안내에 보강했다.
- Market 제작자 계정 발급·목록·토큰 회전·활성화/중지, key 소유권 요청·승인/반려, 버전 제출·승인/반려 API를 운영 반영했다. 제작자 manifest의 author·website는 계정과 일치해야 하며 승인 전 버전은 공개 API에서 보이지 않는다.
- NUBO v1.2.23을 공식 게시하고 nubohub.org를 업데이트했다. 관리 스킨 안내 글자와 명령 배지의 가독성을 높이고 Market 링크 밑줄과 사이드바 버전 앞 점 애니메이션을 제거했다.
- Market `3cd5d77`을 운영 반영하고 기본 스킨 9개를 immutable 0.1.2로 게시했다. 모든 최신 스킨에 대표 이미지가 표시되며 관리 스킨은 추가 화면 2장을 제공한다.
- 스킨 manifest에 필수 대표 이미지와 선택 `screenshots` 최대 9장 계약을 추가하고, 기본 스킨 9개의 실제 1280×720 대표 이미지와 관리 스킨 추가 화면 2장을 준비했다.
- Market 목록·상세에 대표 이미지를 배치하고, 추가 이미지가 있을 때만 3열 그리드와 클릭 확대·재클릭 닫기 오버레이를 표시하도록 구현했다.
- NUBO v1.2.22와 nuboctl 0.13.0을 공식 게시하고 nubohub.org를 같은 GOAPI의 무중단 데이터 경계로 업데이트했다.
- 빈 게시판 그룹의 하위 메뉴에 클릭 불가 `(비어 있음)`을 표시하고, 게시판 그룹·신고 분류 사이드바 버튼의 light/dark 기본 글자 대비를 복구했다.
- 관리 스킨 화면을 공식 Market 탐색, CLI 검색·상세·설치·삭제, customize 적용과 설치/적용 상태 차이를 설명하는 사용자 여정으로 개편했다.
- `nuboctl market help [search|info|install|remove]`와 checksum 영수증 기반의 `market remove [--dry-run]`을 추가하고 nuboctl 버전을 0.13.0으로 올렸다.
- 기본 홈의 `빌더들의 이야기` 바로가기에 GOAPI와 SENSTA 사이 MARKET 버튼을 추가해 공식 `/market/`으로 연결했다.
- NUBO v1.2.21과 nuboctl 0.12.1을 공식 게시했다. 새 CLI는 한글 표시 폭 정렬과 80열 말줄임을 포함한다.
- Noto Sans CJK KR이 적용된 운영 Market·nuboctl을 데스크톱 dark·모바일 light로 최종 검수하고, 모바일 명령 비교표를 화면 안에서 모두 보이도록 조정해 Market `5cefc76`으로 게시·운영 반영했다.
- `nuboctl market search`의 한글 이름 열을 실제 터미널 표시 폭으로 정렬하고 긴 이름을 80열 안에서 말줄임하도록 보정했다.
- Market 카드·비교표·워크플로·사이트 운영 영역의 작은 영문 텍스트를 15–16px로 맞추고 제작자 앞 `by`, 삭제 안내 블록과 헤드라인 마침표를 제거했다.
- `nuboctl market search/info/install` 출력을 색상 대응 헤더·정렬된 열·정보 구획·검증 결과·다음 단계가 있는 터미널 레이아웃으로 개편했다. 비대화형 출력은 ANSI 색상을 넣지 않는다.
- `/var/backups/nubohub-market`의 과거 바이너리 4세트와 최초 설치 전 설정 1세트를 제품 소유자 요청에 따라 삭제했다.
- Market 헤더를 필기체 워드마크와 설명형 아이콘 내비게이션으로 정리하고, 살구색 강조 톤·헤드라인 행간·명령 프로모션·카드 메타데이터·CTA·nuboctl 터미널과 안내문의 가독성을 다듬었다.
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

- Market 운영자 세션은 현재 NUBO 관리자 세션과 분리돼 있어 `/market/operator` 최초 진입에는 서버의 `MARKET_ADMIN_TOKEN`이 필요하다. 서버 비밀을 브라우저에 직접 입력하는 절차를 없애려면 NUBO 관리자 권한을 짧은 수명의 서명 코드로 Market 세션에 교환하는 별도 신뢰 경계를 설계한다.
- 제작자·운영자 화면의 정보 구조와 실제 작업 흐름은 구현됐으며, 제품 소유자의 운영 사용 피드백에 따라 밀도·표현·검토 동선을 조정한다.
- 제작자 신원 확인과 토큰 전달은 운영자 수동 절차다. 이메일 복구나 외부 OAuth를 도입할 때도 NUBO 배포 사이트 회원과 Market 권한을 자동 결합하지 않는다.
- 무료 스킨 리뷰·별점은 제작자·운영 UI 뒤에 진행한다. 첫 버전은 nubohub.org 로그인과 계정당 스킨별 1개만 적용하고 설치 증명·제작자 제한은 실제 남용이 관찰될 때 검토한다.

## Verification

- 포인터 UX 변경은 NUBO unit 29건, ESLint 오류 0건(기존 경고 50), typecheck와 production build를 통과했다. 빌드된 공통 CSS에서 활성 버튼의 `cursor:pointer` 규칙을 확인했으며, Market은 CSS asset 회귀 테스트를 포함한 전체 Go test/vet를 통과했다.
- Market `1229b14`는 전체 Go test/race/vet, 세션 cookie·CSRF·일회성 token 회귀 테스트, MySQL 8 통합 smoke, CI run `32633870893`과 Ubuntu 22.04 정적 빌드를 통과했다. 운영 바이너리 SHA-256은 `8fa0ac79c94fc53b335c65d190254e3a2b39792f4b4fed1b23da1e85c8b1cdba`다.
- 운영에서 실제 creator/admin token 로그인, 장기 token이 없는 세션 cookie 속성, no-store, 기존 `nubo-rehearsal`의 승인 key·공개 버전 표시와 전체 서비스 active/readiness를 확인했다. 로그인 전·후 제작자/운영자 화면을 1440px과 390px Chromium light mode로 검수했다.
- v1.2.25 manual/tag run `32630823394`/`32630978392`에서 통합 build와 Ubuntu 22.04/24.04 fresh-install, 상세 릴리스 노트를 사용한 GitHub Release 게시를 통과했다. 공개 asset SHA-256은 `0362eb02b499c5e78fc335c9b3a9ff587a12fbba1bda4d04e4af89be0810a012`다.
- nubohub.org를 v1.2.25 커스텀 릴리스 `84023fcf07d1`로 전환한 뒤 `nuboctl status` 16건, clean `51dcf5c`, 내부·외부 readiness/version과 NUBO·GOAPI·Nginx·Market active를 확인했다. 무설정 1536 MiB customize dry-run은 별도 후보 `9f66f0f34786`을 준비하고 운영 링크를 바꾸지 않았다.
- 운영 제작자 리허설은 key 승인 전 제출 403, 제출 승인 전 공개 조회 404, 승인 뒤 search/info/상세 HTML 노출과 원본·다운로드 SHA-256 `05388d0d…5ee9` 일치를 통과했다. 발급 토큰은 응답 로그에서 가리고 `/root/.config/nubohub-market/creator-tokens/nubo-rehearsal.token`에 0600으로 보관했다.
- Market `546a72f`는 Go test/vet, 로컬·CI MySQL 8 통합 스모크와 Ubuntu 22.04 공식 빌드를 통과했다. 운영 바이너리 SHA-256은 `b77abc3d997c5c73deb2317f51a63614366f093ea810860165ec0b8a9acb07bf`이며 재배포 뒤 creator 생성 시각과 스킨 공개 시각이 각각 `09:48:20Z`, `09:48:21Z`로 일관되게 조회되고 전체 서비스가 active다.
- v1.2.25 릴리스 후보는 API contract v1 일치, NUBO Vitest 35건, ESLint 오류 0건(기존 경고 50), typecheck·production build와 nuboctl test/race/vet를 로컬에서 통과했다.
- nuboctl 0.14.1의 Node 환경 병합 단위 테스트와 전체 Go test/race/vet를 통과했다. `NODE_OPTIONS`가 없거나 다른 옵션만 있을 때 1536 MiB를 추가하고, dash/underscore 형식의 기존 heap 지정은 변경하지 않음을 확인했다.
- v1.2.24 manual/tag run `32628128070`/`32628284883`에서 통합 build와 Ubuntu 22.04/24.04 fresh-install, GitHub Release 게시를 통과했다. 공개 asset SHA-256은 `3e27865f4255d498cd651e0623f77a261e5cb378314dd04340880cb4dca5151d`다.
- nubohub.org를 v1.2.24 커스텀 릴리스로 전환한 뒤 `nuboctl status` 16건, 내부·외부 readiness/version, NUBO·GOAPI·Nginx·Market active와 clean checkout을 확인했다. `releases prune --dry-run`과 실제 정리는 같은 구버전 17개·1.9 GiB를 선택했으며, 정리 뒤 보호 릴리스 3개와 current/previous 링크를 재확인했다. 릴리스 디렉터리는 2.6 GiB에서 426 MiB, 루트 파일시스템 사용률은 84%에서 77%로 줄었다.
- v1.2.24 릴리스 후보는 API contract 일치, NUBO test 35건, ESLint 오류 0건(기존 경고 50), typecheck·production build와 nuboctl test/race/vet를 로컬에서 통과했다.
- nuboctl 0.14.0의 전체 Go test/race/vet, Linux amd64 정적 빌드와 NUBO Vitest 35건을 통과했다. current·previous·공식 기반·최신 예비 보호, dry-run 무변경, 선택 삭제, 손상 checksum·추가 운영자 파일·일반 previous 파일 보존과 update/customize 전환 시 previous 기록을 단위 테스트로 확인했다.
- NUBO `bcb4f1e`: 전체 테스트 35건, 스킨 독립성 테스트, ESLint 오류 0건(기존 경고 50), typecheck와 최종 production build를 통과했다. 전체 `app/skins` source에서 다른 스킨을 향한 상대·`~/skins` import가 없음을 확인했다.
- 최종 독립 패키지로 임시 MySQL Market의 공식 스킨 11개 게시와 nuboctl 설치 smoke를 통과했다. 운영 공개 다운로드에서도 blog `275a8f0b…942f`, gallery `67b3a79b…6851`, trade `4349b0d8…55af` SHA-256, 대표 이미지 원본, 최신 버전과 archive 내부 무의존성을 대조했고 Market active/ready를 확인했다.
- NUBO `5c2f7bf`: 전체 테스트 34건, 스킨 registry 3건, ESLint 오류 0건(기존 경고 50), typecheck와 production build를 통과했다. registry 테스트는 3개 게시판 계열 스킨 등록과 기존 `nubo-basic-board` 블로그·갤러리 설정의 호환 fallback을 확인한다.
- Market `5fdb7ce`의 임시 MySQL 통합 smoke에서 공식 스킨 11개 게시, `라이트 모드` 검색 11개와 nuboctl 설치를 통과했다.
- 운영 Market에 blog `b26ea554…7994`, board `dbd81eb5…1ac1`, gallery `36d7ba32…96e7` 패키지를 게시했다. 공개 API의 key/version, 1280×720 대표 이미지 원본, 다운로드 SHA-256과 상세 HTML을 대조했으며 전체 11개, 내부·외부 readiness와 systemd active를 확인했다.
- Market `f433ae9` run `32581192232`의 Ubuntu 22.04 build/test와 MySQL 통합 smoke를 통과했다. 운영 바이너리 SHA-256은 `99fcda8758a08764f50a36bda2e823b5db7027d9d42fada09bdbbac6d6862fa7`이며 새 운영자 API 3종 목록, 무토큰 제작자 API 401, 내부·외부 readiness와 전체 서비스 active를 확인했다.
- 제작자 통합 smoke에서 토큰 원문 비저장, 승인 전 key 제출 403, 승인 전 버전 조회 404, 운영자 승인 후 공개, 중복 승인 거부, 토큰 회전과 계정 중지를 확인했다. 운영 반영 전 DB·패키지는 `/var/backups/nubohub-market/20260823-0016-creator-publishing`에 같은 시점으로 백업했다.
- v1.2.23 manual/tag run `32580699837`/`32581039600`: 통합 build와 Ubuntu 22.04/24.04 fresh-install을 통과했다. 공개 asset SHA-256은 `5ddc33a2a61f14b98215a4c06207009bce9573c2a8bbb67dbfc8ee4e8ef3a941`다.
- nubohub.org를 1.2.22에서 1.2.23으로 전환한 뒤 `nuboctl status` 15건, 내부·외부 version/readiness, clean 운영 checkout과 NUBO·GOAPI·Market·Nginx active를 확인했다. GOAPI가 같아 migration과 백업 질문은 생략됐다.
- Market `05c04c2`/`3cd5d77` run `32578848071`/`32579308787`의 Ubuntu 22.04 build/test와 MySQL 통합 smoke를 통과했다. 운영 바이너리 SHA-256은 `24051ee736aa6f28c3606e050beab8b826c54522e70cc5a5a005bf51c347db03`이며 내부·외부 readiness, asset `20260822-6`, 최신 0.1.2 9개와 이미지 원본 바이트를 확인했다.
- 운영 Market 상세를 Chromium desktop light/dark와 390px mobile light로 검수했다. 추가 화면 3열 grid, 클릭 확대와 재클릭 닫기, 스크린샷이 없는 상세의 갤러리 미출력, 390px `innerWidth=scrollWidth=390`을 확인했다.
- 기본 스킨 0.1.2 9개를 임시 MySQL Market에 게시해 대표·추가 이미지 API와 패키지 원본 다운로드를 확인했다. Market Go test/race/vet, MySQL 통합 smoke, Ubuntu 22.04 공식 빌드를 통과했다.
- Market 목록·관리 스킨 상세·스크린샷 오버레이를 Chromium 데스크톱 dark에서 확인했으며, 이미지 로드와 레이아웃이 정상이다. NUBO test 32건, ESLint 오류 0건(기존 경고 50), typecheck와 production build를 통과했다.
- v1.2.22 run `32577075329`: 통합 build 2분 46초, Ubuntu 22.04/24.04 fresh-install 18초/21초와 게시를 통과했다. 공개 asset SHA-256은 `4199dcab84d7930c94e7ef4e635f6b2a804a7cb46c26f6a7caa2c53c62434c22`다.
- nubohub.org를 1.2.21에서 1.2.22로 전환한 뒤 `nuboctl status` 15건, 내부·외부 version/readiness, NUBO·GOAPI·Nginx·nubohub-market active와 nuboctl 0.13.0 help를 확인했다. GOAPI가 같아 migration과 백업 질문은 생략됐다.
- 운영 홈 light/dark에서 빈 `boards` 그룹의 `(비어 있음)`과 MARKET 버튼, 브라우저 오류 없음, 가로 넘침 없음을 확인했다. 관리 그룹·신고 사이드바는 같은 빌드의 mock API light/dark 화면에서 선택·비선택 글자 대비를 확인했다.
- 운영 API에서 `boards` 그룹이 빈 배열임을 확인했다. 로컬 Chromium light/dark에서 `(비어 있음)`, 그룹명과 신고 분류의 선택/비선택 대비, 가로 넘침 없음을 확인했다.
- NUBO test 32건, ESLint 오류 0건(기존 경고 50), typecheck와 production build를 통과했다. nuboctl 전체 test/race/vet와 운영 Market의 install→receipt→remove dry-run→remove 통합 smoke를 통과했다.
- 홈과 관리 스킨 화면을 Chromium 1440px/390px light/dark에서 확인했다. MARKET 순서·모바일 줄바꿈·공식 링크·관리 안내와 한글 렌더링이 정상이며 페이지 가로 넘침이 없다.
- remove는 변경·추가·누락·symlink 파일, 손상되거나 없는 영수증, 패키지의 예약 영수증 포함을 거부하고 원본 폴더를 보존하는 테스트를 통과했다.
- v1.2.21 run `32574750405`: 통합 build 2분 37초, Ubuntu 22.04/24.04 fresh-install 18초/10초와 게시를 통과했다. 공개 asset SHA-256 `0c0190ab33c3c6c2d21b745dd307fdb4b49bfd9cbb9309f3edcb4564fdadfad8`, clean NUBO/nuboctl `7bc009d`, GOAPI `85186af`, nuboctl 0.12.1을 확인했다.
- 운영 Market 데스크톱 dark·모바일 light와 nuboctl 데스크톱 dark·모바일 light에서 Noto Sans CJK KR 한글 글리프, HTTP 200, 브라우저 오류 없음과 페이지 가로 넘침 없음을 확인했다. 모바일 비교표 조정 뒤 표와 컨테이너 폭은 360px로 일치했다.
- Market `29ed6a9`/`5cefc76` run `32574484922`/`32574622281`의 Ubuntu 22.04 build/test와 MySQL 통합 smoke를 통과했다. 최종 운영 바이너리 SHA-256은 `2984cb4e2933786030c94d240e9991a9b700c1e111d5c779b3fe01a8dc7bf09f`이며 asset `20260822-4`, 내부·외부 readiness와 systemd active를 확인했다.
- nuboctl 한글 표시 폭 단위 테스트와 전체 Go test/vet, 실제 운영 Market search/info를 통과했다.
- Market `3a5dde7` run `32572827347`의 Ubuntu 22.04 build/test와 MySQL 통합 smoke를 통과했다. 운영 바이너리 SHA-256은 `c2dd298e9a27270f4c86ec3019465272c02d88d5a9c85502e883650b8566b749`이며 외부 asset `20260822-3`, readiness, systemd active와 빈 Market 백업 디렉터리를 확인했다.
- nuboctl `0d285fa`의 전체 test/vet, 실제 운영 Market search/info 색상 터미널 출력과 기본 스킨 9개 게시를 포함한 install 통합 smoke를 통과했다.
- Market `7254835`를 데스크톱 dark·모바일 light·nuboctl dark 실브라우저로 확인하고 `go test`, `go vet`, shell 구문 검사와 MySQL 게시→조회→다운로드 smoke를 통과했다. 운영 바이너리 SHA-256은 `741c2356ae8f24fc85a3109011596fbbf1f2e1f20532e5fb4bd0cdb1fb2c55ff`이며 이번 배포에는 별도 바이너리 백업을 추가하지 않았다.
- 운영 `/market/`의 `20260822-2` CSS, 아이콘 설명, `/market/nuboctl` 콘텐츠와 외부 readiness 200을 확인했다. 강조용 HTML 때문에 깨진 문자열 기반 smoke는 `d5dea17`에서 의미 기반 검사로 보정했고 run `32572163829`의 Ubuntu 22.04 build/test와 MySQL 통합 smoke를 통과했다.
- Market `b5a26c3`/`d2f5ae5` run `32570563315`/`32570742778`의 Ubuntu 22.04 build/test와 MySQL 통합 smoke를 통과했다. 데스크톱 dark·모바일 light 실브라우저 캡처를 확인했고, 운영 목록 9개·공통 태그 검색 9개·nuboctl 페이지·CSP와 NUBO/GOAPI/Market/Nginx active를 확인했다.
- 당시 운영 Market 바이너리 SHA-256 `0a59f3b90860c02297c1473c3218b97e84e1d0ba669c4ac28562d949277cf82a`에 stylesheet cache-busting을 적용했다.
- v1.2.20 run `32568166081`: 통합 build 2분 30초, Ubuntu 22.04/24.04 fresh-install 19초/23초와 게시를 통과했다. 공개 asset SHA-256 `043bc65cf9cf9c2fad09517d6422cb49609e6bc1af25204c5b6c61f5a47aba2b`, clean NUBO/nuboctl `85a1130`, GOAPI `85186af`, nuboctl 0.12.0을 확인했다.
- nubohub.org를 1.2.19에서 1.2.20으로 전환한 뒤 `nuboctl status` 15건, 내부·외부 version/readiness, `market search/info`, NUBO·GOAPI·Market·Nginx active를 확인했다. GOAPI가 같아 migration과 백업 질문은 생략됐다.
- Market `53f3e50` run `32568424692`의 Ubuntu 22.04 build/test와 MySQL 통합 smoke를 통과했다. 당시 운영 바이너리 SHA-256은 `4969f5187831a18bc01bb8b89cf8d729701ae9e4c7d8efb6cd0633d551581cff`였다.
- 리팩터링 뒤 이번 Market/nuboctl 구현의 최대 함수는 각각 44줄/32줄이며 관련 구현 파일은 50~187줄로 분리했다. 기존 169줄 CLI dispatch도 명령별 handler로 분리했다. 전체 Go test/race/vet와 9개 기본 스킨 게시를 포함한 MySQL 통합 smoke를 통과했다.
- 외부 `/market/` 목록 9개, 검색·상세·CSS, CSP, 각 설치 명령과 SHA-256 노출을 확인했다.
- 운영 서버의 내부·외부 Market readiness, 별도 사용자와 systemd hardening, 제한된 DB 권한, Nginx 설정, 게시·목록·상세·다운로드를 확인했다. 무토큰 게시 401, 중복 버전 409, 운영 패키지 SHA-256과 로컬 `nuboctl` 설치 결과의 원본 일치를 확인했으며 기존 NUBO Web readiness도 정상이다.
- NUBO Market `go test ./...`, `go vet ./...`, MySQL 8 게시→조회→다운로드 원본 비교와 실제 `nuboctl` 설치 통합 smoke를 통과했다. Ubuntu 22.04 컨테이너에서 정적 linux/amd64 바이너리 SHA-256 `0fdeab264d933abe855ca2140cb84b38aad8e813ea074e8eaf4c730eb2775ff4`를 만들었다.
- NUBO nuboctl 전체 Go test/vet, 0.12.0 Ubuntu 22.04/24.04 실행, unit 28건, ESLint 오류 0건(기존 경고 50), typecheck를 통과했다.
- v1.2.19 run `32561064226`: 로컬 통합 build 2분 36초, hosted Ubuntu 22.04/24.04 fresh-install 25초/18초와 게시를 통과했다. 공개 asset checksum, clean NUBO/nuboctl `73c8a3c`, GOAPI `85186af`, nuboctl 0.11.0, API contract 1을 확인했다.
- source pull 단위 테스트 4건, 전체 NUBO 테스트 32건, ESLint 오류 0건(기존 경고 50), typecheck, production build, API contract 일치, nuboctl test/race/vet를 통과했다. Linux amd64 nuboctl 0.12.0에서 실제 `market search board`도 확인했다.
- v1.2.18 run `32559598632`: WSL2 self-hosted build 2분 35초, hosted Ubuntu 22.04/24.04 fresh-install 18초/19초와 게시를 통과했다. 공개 asset의 SHA-256, clean NUBO/nuboctl `1b34bd3`, GOAPI `85186af`, API contract 1을 다시 확인했다.
- sensta.me update 후 `nuboctl status` 16건과 `doctor` 17건, GOAPI/Web/Nginx, 내부·외부 `/ready`와 `/version`을 확인했다.

## Next action

- 제품 소유자가 `/market/creator`와 `/market/operator`를 실제 사용하며 UI와 작업 흐름을 검수하고 피드백을 전달한다.
- UI 피드백 반영 뒤 nubohub.org 로그인 사용자에게 설치·제작자 여부와 무관하게 계정당 스킨별 1개 리뷰·별점을 허용하는 최소 기능을 구현한다.
