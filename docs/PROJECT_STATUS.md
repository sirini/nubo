# NUBO project status

## Active goal

- 영구 업적 기반은 세 저장소 `main`에 반영했고 운영에서 관리자 수동 수여와 Sensta Android의 1회 축하·
  프로필 반영까지 확인했다. 남은 목표는 Sensta 2.1.3 Play 제출과 웹·Android 최종 표시 점검이다.
- Sensta iOS는 공개 사진 피드를 화면 전체 세로 페이징과 워드마크·정보 오버레이로 완성하고, 게시글
  상세에는 고화질 다운샘플링·캐시·예열과 연속 추적 가로 페이징을 적용했다. 제품 소유자가 실기기
  감상 성능·디자인을 승인했고, 페이지 추가 로딩·전체 화면 확대 감상·본문 아래 댓글·최근 사진 탐색과 다중 검색까지
  구현했다. EXIF 요약과 AI 설명은 라이트/다크 테마를 따르는 하나의 음영 패널로 정리했다.
  AI 설명·제목·본문·닉네임·해시태그 검색과 최근 태그는 기존 Android용 API를 재사용한다.
  제품 소유자가 탐색의 디자인과 실기기 동작을 승인했다. 이어 공개 프로필·최근 작품 그리드를 추가했고
  사진가 업적과 작품·사진·좋아요 공개 통계를 iOS `34a86f7`에 추가했다. 단위 48개·UI 10개와 Debug/Release
  빌드를 통과하고 iPhone에 설치했다. GOAPI `934d836`의 새 공개 통계 endpoint는
  운영 반영을 2026-09-05 완료했으며, 기존 Android 본인 스튜디오 계약은 유지한다. Go 전체 테스트·vet를 통과했다.

## Current decisions

- Sensta iOS는 `sirini/sensta-ios`에서 SwiftUI·Swift concurrency와 Apple 기본 프레임워크를 우선해
  개발한다. Android의 데이터·제품 동작은 유지하되 iOS 관례에 맞추고, beta Xcode는 현재 개발에만
  사용하며 제출 전 당시 허용되는 안정판 Xcode로 다시 검증한다.
- Sensta iOS 공개 피드는 `GET /board/list`를 인증 헤더 없이 호출하고 Android와 같은 차단 목록 필터 및
  `cover` 미리보기 경로 변환을 적용한다. API 기능은 fixture와 Swift 요청·decoding 회귀 테스트를 먼저
  고정한다.
- Sensta iOS 게시글 상세도 익명 `GET /board/view` 계약을 사용한다. 사진별 EXIF·AI 설명, 본문·태그·
  첨부 정보와 시스템 공유를 네이티브 SwiftUI로 표시하고 원격 이미지 크기가 화면 폭을 넓히지 않도록
  Geometry 기반으로 제약한다.
- Sensta iOS는 사진 품질과 부드러운 감상을 우선한다. 2400px 미리보기는 유지하되 ImageIO가 원본과 표시
  영역 종횡비·화면 scale을 고려해 백그라운드 다운샘플링하고, 메모리·디스크 캐시와 인접 사진 예열로
  반복 다운로드·디코딩을 줄인다.
- 배지는 한 번 획득하면 유지되는 업적만 다룬다. 만료·구독·활성 상태는 넣지 않으며 관리자 표시는 기존
  `admin` 상태와 권한 응답을 계속 사용한다.
- 첫 내장 업적은 `first-post`, `first-comment`, `sensta-app` 세 개다. 프로필은 전체 업적을 받고,
  작성자 이름 옆에는 GOAPI가 `show_inline`으로 선별한 업적만 전달한다. 현재 인라인 표시는 사진 중심
  `nubo-advance-gallery`와 Sensta Android 피드·상세에 적용한다.
- 기존 글·댓글은 내장 업적별 최초 설치 시 한 번만 소급하고 완료 시점을 기록한다. 이후 작성 경로는
  사용자·배지 유니크 키에 `INSERT IGNORE`하여 매번 활동량을 세지 않는다.
- Sensta Android 출처 헤더는 앱 활동 업적용 공개 표식이며 보안 자격 증명이나 사용자 인증 수단으로
  취급하지 않는다. 실제 사진 첨부 저장이 성공한 게시글만 출처와 `sensta-app` 업적을 기록한다.
- `GET /board/my/studio`는 API contract v1을 유지하는 additive JWT endpoint다. 사용자 UID는 token에서만
  얻고 본인의 일반글·비밀글만 대상으로 DB aggregate와 page query를 실행한다.
- 기존 필터 및 `post_uid` 인덱스로 범위를 효율적으로 제한할 수 있어 studio용 DB migration은 추가하지
  않았다. 운영 데이터에서 병목이 확인될 때만 `EXPLAIN` 근거로 복합 인덱스를 검토한다.
- NUBO는 소스 checkout을 운영자가 직접 빌드·실행하는 Source Mode를 기본으로 한다. CLI는 Git, npm,
  Nuxt build, DB migration, tmux·PM2·systemd·Nginx lifecycle을 자동 실행하지 않는다.
- 공식 GOAPI는 형제 `goapi.git`의 exact commit을 descriptor에 고정하고 반드시 GOAPI의
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
- 관리자 화면·README·Market의 현재 사용자 안내는 `./bin/nubo`만 사용한다. v1.2 `nuboctl` 자료는
  과거 릴리스 보존 범위이며, Market의 기존 `/nuboctl` URL만 새 `/nubo` 페이지로 영구 리다이렉트한다.
- 운영 Market의 실행 파일·설정·패키지 데이터는 nubohub.org의
  `/var/www/market/{bin,config,data}`에 모아 관리한다.
- 릴리스 build는 개발 PC 상태와 분리하기 위해 GitHub-hosted Ubuntu 22.04를 기본으로 한다. `v1.3.1`
  공개 asset도 hosted runner에서 만들었으며 WSL2 PC는 사용하지 않았다. self-hosted runner는 명시적으로
  전환할 때만 사용하는 선택 사항이다.
- TSBOARD 1.3.0은 NUBO 1.3.0 Linux amd64 릴리스의 GOAPI 1.3.0·libvips 8.18.3 조합을 descriptor에
  고정하고, `npm run runtime:download`로 `bin/goapi`, `lib`, `licenses/sharp-libvips`에 준비한다.

## Open findings

- 수동 수여 취소와 별도 감사 이력 화면은 이번 최소 범위에서 제외한다. 사용자별 유니크 원장과
  `grant_source`·`granted_by`는 유지하며, 운영에서 정정 요구가 확인될 때 감사 로그를 먼저 추가한다.
- Market 제작자 device-code token 발급·폐기와 제출 심사 API의 최종 계약은 인증 CLI 작업 전에
  `/Users/sirini/github/nubohub-market.git`과 함께 다시 고정해야 한다.

## Recent completion

- 2026-09-05 Sensta Ubuntu 22.04 VM에서 Docker Buildx를 설치하고 공식 스크립트로 GOAPI를 빌드·배포했다.
  GOAPI `1cf4b1d`는 x86-64-v2 미지원 빌드 호스트에서도 호환판 선택을 허용하고 QEMU `qemu64`·`max`로
  두 변형의 자동 선택과 JPEG→WebP 변환을 검증한다. Ubuntu 22.04·24.04 이미지 테스트와 외부
  health·ready, Nuxt HTTP 200을 확인했다. 이전 runtime은 `/var/backups/sensta-goapi-20260905-170051`에
  보관했고, 전용 Docker 빌드 캐시를 제거해 서버 여유 공간을 약 21GiB로 복구했다.

- Sensta iOS 공개 피드를 Android의 대표 화면처럼 사진 한 장이 노치·홈 인디케이터 영역까지 채우는
  세로 paging으로 바꿨다. 좌상단 `SENSTA` 워드마크는 Android의 Oleo Script Bold 원본 glyph·18pt 크기·
  60% 투명도를 그대로 옮긴 벡터로 통일했고, 하단 그라데이션 위 작성자·제목·통계를 배치했다. 상세
  진입 시에는 iOS 내비게이션 바가 복원되도록 분리했다.
- Sensta iOS의 기본 `AsyncImage`를 ImageIO 기반 표시 크기 다운샘플링, 96MiB 디코딩 메모리 캐시와
  512MiB 응답 디스크 캐시, 동일 요청 병합·취소 기능을 가진 사진 파이프라인으로 교체했다. 피드 다음
  사진과 상세 앞·뒤 사진을 예열하고 상세 `TabView`를 손가락 위치를 연속 추적하는 가로 ScrollView
  paging으로 바꿨다. 가로 사진을 세로 프레임에 채워도 필요한 픽셀을 보존하도록 종횡비를 계산한다.
- Sensta iOS에 `GET /board/view` 응답 fixture와 익명 요청·decoding·오류 envelope·상태 테스트를 추가하고
  피드 카드에서 게시글 상세로 이동하도록 연결했다. 여러 사진 넘김, EXIF·AI 설명, 본문·태그·첨부 정보·
  통계·공유를 제공하며 목록과 상세의 좌우 폭을 UI test로 고정했다. unit 14개·UI 3개, Release build와
  정적 분석을 통과하고 실제 iPhone에 새 Debug 앱을 설치·실행했다.
- Sensta iOS 첫 공개 피드에 GOAPI 목록 DTO·fixture, 익명 요청·오류 envelope·상태 회귀 테스트와
  로딩·빈 상태·오류·재시도·당겨서 새로고침 UI를 추가했다. 운영 사진으로 라이트·다크·큰 글자 화면,
  Debug test build·Release build·정적 분석, unit 9개·UI 1개를 통과하고 실제 iPhone 설치·실행을 확인했다.
- Sensta iOS의 Xcode에 Team `WKPCU58CWL`을 연결하고 iPhone 17에서 개발자 모드를 활성화했다. 자동
  서명으로 기기를 계정에 등록하고 Apple Development 인증서와 `me.sensta.ios.debug` provisioning
  profile을 생성했으며, 실제 기기 빌드·설치·실행과 실행 중 프로세스를 확인했다.
- Sensta iOS에 iOS 17 이상·iPhone 전용 SwiftUI app, unit/UI test target과 shared scheme을 만들었다.
  Debug `me.sensta.ios.debug`·Release `me.sensta.ios`, Team `WKPCU58CWL` 자동 서명, 운영
  `https://sensta.me/goapi/` xcconfig와 Apple capability entitlements를 고정했다. Xcode 27의 Debug·
  Release 시뮬레이터 빌드와 unit 3개·UI 1개 테스트가 통과했다.
- Sensta iOS의 Apple Developer Team `WKPCU58CWL`, 2027-09-04 만료와 계약 동의를 확인했다. 레거시
  기기를 정리하고 운영 `me.sensta.ios`·개발 `me.sensta.ios.debug` App ID에 Associated Domains,
  Push Notifications와 Sign in with Apple을 활성화했다. App Store Connect에는 `SENSTA`(Apple ID
  `6808687447`)를 만들고 무료·대한민국 배포, 사진 및 비디오/소셜 네트워킹 카테고리, 수동 출시로
  설정했으며 미검증 Mac·Vision Pro 배포는 껐다. 개인 개발자 계정의 대한민국 연락처 및
  사업자등록번호 보유 여부 확인도 완료했다.
- Sensta iOS 공개 저장소를 만들고 Xcode 27.0·Swift 6.4·iOS 27 simulator 환경과 라이선스·초기 구성을
  확인했다. Apple Developer Program 재가입은 승인됐으며, GOAPI의 iOS 인증·푸시·HEIC·출처·UGC 선행
  작업과 Firebase/APNs/App Store 준비 체크리스트를 문서화했다. Team·코드서명과 앱 프로젝트는 아직
  준비하지 않았다.
- 세 저장소의 업적 작업을 GOAPI `5b17f51`, NUBO `4f2d01d`, Sensta Android `2024fa8`까지 `main`에
  반영했다. Sensta 2.1.3(`versionCode 26`)은 `작품·정보·업적` 3탭 프로필과 2열 진열장으로 정리했고,
  서명된 AAB의 SHA-256은 `34d73c001ae09f8e8043387eb21cd75944fa9f4484e0f6d0a194dbe9e777cf4d`다.
- 댓글 목록 API도 작성자 UID를 중복 제거해 인라인 업적을 한 번에 배치 조회한다.
  `nubo-advance-gallery`는 댓글 작성자 이름 옆에 서버가 `show_inline`으로 선별한 업적만 표시하며,
  별도 Sensta 전용 스킨이나 단계형·현재 상태 배지는 추가하지 않았다.
- GOAPI에 사용자별 미확인 업적 조회·확인 API와 `announced_at` 원장을 추가했다. 기존 획득·소급 업적은
  migration 시 확인 완료로 처리해 새 기능 배포 직후 과거 업적 알림이 몰리지 않는다. NUBO는 글·댓글
  작성 및 화면 이동 뒤 새 업적을 확인하고, 접근성 동작 축소를 존중하는 순차 축하 연출과 프로필 이동을
  제공한다. Sensta Android에도 같은 확인 계약, 전역 축하 다이얼로그, 본인·다른 사용자 프로필 전체
  업적 진열장을 연결했다.
- GOAPI에 관리자 전용 업적 정의 조회·생성·수정과 사용자별 조회·멱등 수여 API를 추가했다. 내장 자동
  업적은 수정 불가이고 사용자 정의 업적은 안전한 공용 아이콘 카탈로그만 사용한다. NUBO 기본 관리자
  스킨에는 업적 배지 메뉴와 사용자 수정 화면의 2단계 수여 UI를 연결했다.
- GOAPI에 일반화된 업적 정의·사용자 획득 원장·게시글 출처 테이블과 첫 글·첫 댓글 소급 및 실시간 수여,
  프로필 전체/작성자 인라인 조회를 추가해 `1302514`로 main에 push했다. NUBO에는 공용 배지 아이콘·
  툴팁·프로필 진열장과 advance gallery 연결을 추가했다. Sensta Android는 앱·버전 출처 헤더, DTO와
  피드·상세 작성자 배지를 `51792ff`로 main에 push했다.
- 기본 관리자 스킨의 스킨 관리·runtime 경고와 NUBO/Market README를 새 CLI 및 Source Mode 계약으로
  갱신했다. Market 카탈로그·상세·CLI 안내를 `/nubo`와 `./bin/nubo ... skins/<key>`로 전환하고,
  관리 스킨은 `0.1.3`·최소 NUBO `1.3.1`로 올렸다. Market 변경은 `fa37809`로 main에 push했다.
- Sensta 전용 Newsta를 private `sirini/newsta` 저장소로 이관하고 운영 checkout을 `a79a2a7`에 맞췄다.
  활성·만료·비활성 후보와 최근 실행을 보여주는 `status`, heuristic `filtered` 상태, 오류 후에도 지속되는
  60분 daemon과 `scripts/newsta-tmux` 관리 도구를 추가했다. 운영 `.env`·SQLite는 보존했으며 systemd
  service/timer 정의는 rollback용 state 백업으로 옮기고 `newsta` tmux 세션만 실행한다.
- `nubo-advance-profile` 0.1.0을 추가했다. 공개 프로필·최근 활동·프로필 관리·신고·차단·대화를 유지하면서
  본인에게만 게시판별 작품·사진·조회·좋아요·댓글 누계와 정렬·paging 작품 목록을 보여준다. Sensta에서는
  `photo`를 우선 선택하지만 다른 NUBO 배포에서는 실제 메뉴의 첫 게시판으로 fallback한다.
- 게시글 상세의 공통 좋아요 상태가 성공 직후 숫자까지 반영되도록 고쳤다. 모든 기본·advance 상세 스킨에
  함께 적용되며 게시글·댓글 모두 진행 중 중복 요청과 음수 count를 방지한다.
- Sensta Android용 `GET /board/my/studio`를 GOAPI `cb485a4`로 main에 push했다. JWT UID 격리, 본인 비밀글
  포함, 삭제글·공지 제외, 실제 첨부 이미지와 liked/댓글 상태 집계, 네 정렬·paging·공개 cover 제한을
  구현했고 NUBO에 동일 경로 proxy와 TypeScript 계약을 추가했다. 기존 release provenance는 변경하지 않았다.
- nubohub.org에서 중복 `/swapfile`, 사용하지 않는 v1.2 `.nubo` cache와 오래된 journal을 안전하게
  정리해 루트 사용률을 88%에서 56%로 낮췄다. 활성 LVM swap은 보존하고 journal 상한은 512MiB로 뒀다.
- 운영 Market을 `/var/www/market`으로 이전하고 systemd·Nginx·내부 및 외부 readiness, package 39개
  파일의 상대 경로별 hash 일치를 확인했다.
- annotated tag `v1.3.1`을 NUBO `afb6ff2`에 붙이고
  [GitHub Release](https://github.com/sirini/nubo/releases/tag/v1.3.1)를 게시했다. runtime은 작품 스튜디오를
  포함한 GOAPI `cb485a4fab5dd87b0b5f7a847d82c0700f8a18e0`, API contract v1, libvips 8.18.3을 고정하며
  DB migration은 요구하지 않는다.
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

- Sensta iOS 다운샘플 크기·가로 사진 세로 fill 품질·메모리 캐시·동시 요청 병합 회귀를 포함한 unit
  18개와 화면 네 변을 채우는 피드·워드마크·상세 이동/폭 UI 3개, 총 21개 테스트가 통과했다. Release
  simulator build와 정적 분석, 실제 iPhone용 `-O` 최적화 Debug 자동 서명·설치·실행도 확인했다.
- Sensta iOS 운영 `GET /board/view` 응답을 Android·GOAPI 계약과 대조했고 상세 fixture·익명 요청·오류·
  상태 및 목록/상세 폭 회귀를 포함한 전체 17개 테스트, Release build와 정적 분석을 통과했다. 실제
  iPhone용 Debug 자동 서명, 설치와 실행도 확인했다.
- Sensta iOS 환경 점검 스크립트가 `/Applications/Xcode-beta.app`의 Xcode 27.0(`27A5252f`), Swift 6.4,
  iOS 27.0 SDK와 simulator runtime을 확인했고 shell syntax 및 Git whitespace 검사를 통과했다.
- 댓글 작성자 인라인 업적 배치·중복 제거 서비스 테스트와 NUBO 렌더링 계약 테스트를 추가했고,
  GOAPI 전체 test·vet 및 NUBO typecheck·lint를 통과했다.
- 미확인 업적 schema/repository 테스트와 GOAPI 전체 test·vet·Ubuntu 22.04 Docker build, NUBO 업적 계약
  테스트·typecheck·lint(오류 0, 기존 경고 50)·production build, Sensta Android 전체 Gradle test를
  통과했다. NUBO 전체 unit의 기존 Windows 전용 실패는 배포 스크립트의 symlink·CRLF 가정에 한정된다.
- 업적 schema/repository를 포함한 GOAPI `go test ./...`, `go vet ./...`와 공식 `build-ubuntu22.sh`의
  Ubuntu 22.04·24.04 및 x86-64 호환 검증을 통과했다. NUBO 관련 unit 15개, lint 오류 0건(기존 경고
  50), typecheck와 production build를 통과했고 Sensta Android 전체 Gradle test도 통과했다.
- 현재 CLI 안내 회귀 테스트를 포함한 NUBO 전체 79개 테스트, lint 오류 0건(기존 경고 50), typecheck,
  production build, release contract와 `tools/nubo` test·vet를 통과했다. 관리자 스킨 package도 새 CLI로
  검증했다. Market은 `go test ./...`, `go vet ./...`, 임시 MySQL 및 새 CLI 실제 설치 통합 smoke,
  Ubuntu 22.04 정적 Linux amd64 빌드를 통과했다.
- Newsta 전체 35개 테스트와 서버의 동일 테스트·offline doctor를 통과했다. private 저장소 전용 read-only
  deploy key, clean checkout, 첫 daemon cycle의 8개 feed 성공·오류 0·negative 후보 filtered 처리와 다음
  실행 대기, systemd unit not-found 및 tmux running 상태를 확인했다.
- advance profile의 JWT 자기 프로필 제한, 네 정렬, 공개 cover 유지, secret 표시와 기존 프로필 기능 보존
  계약 테스트 및 skin package 격리 테스트를 통과했다.
- 좋아요 상태 전이와 advance profile 계약을 포함한 frontend 전체 77개 테스트, lint 오류 0건(기존 경고
  50), typecheck, production build와 release contract를 통과했다.
- studio repository/service/handler/router 회귀 테스트와 GOAPI `go test ./...`, `go vet ./...`를 통과했다.
  공식 `build-ubuntu22.sh`는 Ubuntu 22.04·24.04 및 x86-64 runtime 검증을 통과했다. NUBO는 전체 72개
  테스트, lint 오류 0건(기존 경고 50), typecheck, production build, API contract v1 검증을 통과했다.
- 새 Go CLI는 descriptor·download·archive traversal·checksum·atomic rollback·dry-run·취소 보존 단위
  테스트와 `go test -race ./...`, `go vet ./...`를 통과했다.
- macOS에서 `CGO_ENABLED=0 GOOS=linux GOARCH=amd64` cross-build 결과가 정적 Linux amd64 ELF임을
  확인했다.
- 비게시 preflight Actions run `33297210116`과 tag publish run `33298138773`이 전체 NUBO 검증, GOAPI
  공식 Docker test·vet 및 `build-ubuntu22.sh`, Ubuntu 22.04·24.04 runtime smoke를 통과했다. 공개 CLI는
  8,683,682-byte 정적 Linux amd64 ELF이며 SHA-256은
  `c86a37d930080348791ef3eefecebc31b8d4b2db19946e9276e8702cd3782de0`, runtime archive는
  30,974,972 bytes이며 SHA-256은 `c91b0d7fa46bc98822f14e84b11327a934a6ac8e402e6ead9943e56057e2fc02`다.
  공개 자산을 다시 내려받아 외부·내부 checksum, `nubo 1.3.1`, GOAPI commit과 libvips 동적 링크를 확인했고
  preflight 자산과 byte-identical임을 확인했다.
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

- Sensta iOS `4b429a9`·`6cd2ab0`에서 요청 취소 처리·새로고침 실패 시 사진 보존·공개 피드 페이지 추가
  로딩을 반영했다. 공지 개수와 차단 전 응답 기준으로 종료를 판단하고 중복 제거·오류 재시도·새로고침
  동시 실행을 검증했다. 단위 27개·UI 4개와 Debug/Release 빌드가 통과했으며 오늘 변경의 실기기 QA는
  남아 있다. API·Android·웹 동작 변경은 없다.

- Sensta iOS `0bc745d`·`e7098e9`에서 전체 구도 표시·핀치/두 번 탭 확대 감상과 여백 중심 상세,
  기존 `/comment/list`를 이용한 공개 댓글·답글·더 보기·재시도를 구현했다. 단위 36개·UI 6개와
  Debug/Release 빌드·캡처 QA·운영 댓글 API 확인을 마쳤고 iPhone 17 설치·실행도 확인했다. GOAPI와
  Android 코드는 변경하지 않았으며 서버 재시작·Firebase 설정은 필요 없다.

- Sensta iOS `92dace9`·`a5e2b33`에서 EXIF 요약/AI 설명을 단일 테마 패널로 묶고 댓글을 본문 아래로
  옮겼다. 공개 제목 검색·사진 격자·상세 이동도 기존 API로 추가했다. 단위 37개·UI 8개와 Debug/Release
  빌드, 라이트/다크/큰 글자 및 검색 캡처 QA를 통과했고 iPhone 17에 새 서명 앱을 설치·실행했다.
  GOAPI·Android 변경이나 서버 재시작은 필요 없다.

## Next action

1. Sensta 2.1.3 AAB를 Play Console에 올리고 내부 테스트 또는 단계적 배포에서 로그인·업로드·업적 흐름을
   확인한다.
2. 잠금 해제한 Galaxy에서 3탭 프로필과 축하창의 업적 탭 이동을 최종 확인하고, 운영 웹에서는
   `nubo-advance-gallery` 댓글 작성자 인라인 업적과 웹 축하창을 한 번씩 점검한다.
3. 실제 운영 요구가 생기기 전까지 수여 취소·감사 UI, 단계형·상태형 배지와 추가 자동 업적은 확장하지 않는다.
4. Sensta iOS 새 빌드의 EXIF/AI 패널·본문 아래 댓글·제목 검색을 실기기에서 확인한다. 다음은 사진가
   화면을 서버 변경 없이 진행한다. 기존 Android 인증 경로는 플랫폼 검사 없이 네이티브 계약을
   제공하므로 별칭 추가를 선행 조건으로 두지 않는다. Apple 인증·push 서버 변경은 해당 기능 작업 때
   기존 Android 호환성·회귀 테스트와 함께 검토한다.
