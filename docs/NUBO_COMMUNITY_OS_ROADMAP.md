# NUBO Community OS 성장 공략집

> 저장 경로: `docs/NUBO_COMMUNITY_OS_ROADMAP.md`  
> 문서 성격: 장기 전략 + 구현 로드맵 + Codex 작업 지침  
> 기준 시점: 2026-08-19
> 기준 버전: NUBO v1.2.11 released + main / GOAPI main
> 상태: 살아 있는 문서(Living Document)

---

## 0. 이 문서의 목적

이 문서는 NUBO를 기능이 많은 범용 CMS로 만드는 계획서가 아니다.

NUBO가 먼저 달성해야 할 목표를 **“사진·전자기기·게임·취미 커뮤니티를 운영하기 좋은 현대적인 Community OS”**로 고정하고, 개발 시간이 생길 때마다 Codex와 함께 한 단계씩 안전하게 진행하기 위한 공략집이다.

이 문서가 해결하려는 문제는 다음과 같다.

1. 다음에 무엇을 해야 할지 매번 새로 고민하지 않는다.
2. 눈앞의 재미있는 기능 때문에 기반 안정화가 밀리지 않게 한다.
3. NUBO와 GOAPI를 하나의 제품으로 보고 API·배포·호환성을 함께 관리한다.
4. 기능을 추가할 때 “코어”, “모듈”, “스킨”, “외부 연동” 중 어디에 속하는지 먼저 판단한다.
5. 각 작업의 완료 조건을 명확히 하여 Codex가 “코드 작성 완료”를 “제품 완료”로 착각하지 않게 한다.
6. 운영자에게 가장 중요한 설치·업데이트 경험과 데이터 책임 경계를 명확히 한다.
7. 장기적으로 다른 개발자가 참여해도 프로젝트 방향이 흔들리지 않게 한다.

이 문서는 일정표가 아니며, 위에서 아래로 반드시 구현해야 하는 백로그도 아니다. 시간이 없을 때는 멈춰도 된다. 다시 시작할 때는 현재 코드와 운영 문제를 먼저 확인한 뒤, 가치가 높은 작은 `READY` 퀘스트 하나를 선택한다.

## 0.1 문서 해석 원칙

- 이 문서의 시간 범위는 향후 5~10년이며, 세부 순서와 해결 방식은 계속 바뀔 수 있다.
- 스테이지와 큰 퀘스트는 방향과 의존성을 보여주는 이정표다. 하나의 작업 단위로 간주하지 않는다.
- 구현 전에는 이미 해결된 부분과 실제 운영 문제를 확인하고, 제품 소유자와 범위·완료 조건을 합의한다.
- 큰 퀘스트는 독립적으로 검증 가능한 작은 변경으로 나누고, 필요가 확인된 만큼만 구현한다.
- 로드맵에 있다는 이유만으로 추상 계층, 상시 프로세스, 외부 인프라를 미리 만들지 않는다.
- 안정화와 제품 차별화는 한쪽을 장기간 미루지 않고, 위험과 효과가 분명한 작은 단위로 번갈아 진행할 수 있다.
- 테스트는 인증·권한·데이터 손실·동시성·배포처럼 실패 비용이 큰 경계를 우선한다. 구현 세부를 반복하거나 실질적인 회귀를 잡지 못하는 테스트는 수량을 위해 추가하지 않는다.
- 이 문서의 장기 항목은 아이디어 지도이며 현재 구현 의무가 아니다. 실제 작업은 `docs/PROJECT_STATUS.md`의 작은 목표를 우선한다.

## 0.2 현재 제품 범위

NUBO의 현재 대상은 직접 서버를 운영하며 한국어 커뮤니티를 만들고 싶은 개인·소규모 운영자다.
먼저 한 대의 익숙한 Ubuntu 서버에 부담 없이 설치하고 운영하는 경험을 완성한 뒤, 실제 수요가 확인된 범위만 넓힌다.

현재 지원 범위:

- 한국어 사용자와 한국어 설치 안내
- Ubuntu 22.04 이상 amd64 한 대
- systemd, Nginx, Node.js, MySQL/MariaDB
- 소스 빌드가 필요 없는 공식 prebuilt
- 사람을 위한 대화형 `nuboctl install`
- AI·자동화를 위한 명확한 비대화형 옵션과 설치 계약 문서

현재 범위에서 제외:

- 컨테이너와 Kubernetes
- 다중 Linux 배포판과 범용 배포 추상화
- 다국어 CLI와 다국어 설치 문서
- 복잡한 stable/preview/nightly 릴리스 채널
- 다중 인스턴스와 대규모 분산 운영

제외 항목은 미래 약속이 아니다. 실제 사용자 요구와 유지보수 여력이 생길 때 다시 판단한다.

---

# 1. 최종 목표

## 1.1 North Star

> **NUBO는 한국형 커뮤니티를 가장 현대적이고 안전하며 즐겁게 구축하고 운영할 수 있는 오픈소스 Community OS다.**

NUBO의 성공 기준은 “그누보드나 라이믹스보다 기능이 많다”가 아니다.

다음 질문에 가장 좋은 답을 주는 것이 성공 기준이다.

- 새 커뮤니티를 만들 때 왜 NUBO를 선택해야 하는가?
- 비개발 운영자가 설치·업데이트를 두려워하지 않는가?
- 관리자가 대규모 커뮤니티를 DB 직접 수정 없이 운영할 수 있는가?
- 모바일에서 글과 사진을 보는 경험이 경쟁 제품보다 좋은가?
- 사진을 올리고 감상하는 경험이 NUBO의 대표 기능이라고 말할 수 있는가?
- 코어를 직접 수정하지 않고도 사이트 성격을 바꿀 수 있는가?
- 기존 CMS에서 데이터와 URL을 잃지 않고 이전할 수 있는가?
- 5년 뒤에도 업데이트할 수 있고 운영자가 자신의 백업으로 복구할 수 있다고 신뢰하는가?

## 1.2 초기 핵심 사용처

우선순위가 높은 사용처:

1. 사진·카메라 커뮤니티
2. 전자기기·PC·모바일·오디오 커뮤니티
3. 게임·길드·클랜·팬 커뮤니티
4. 취미 동호회와 협회
5. 회원 중심의 비공개 또는 초대형 커뮤니티
6. 개발자가 직접 운영하는 중소 규모 공개 커뮤니티
7. 사내 또는 조직 내부 커뮤니티

당장 우선순위가 낮은 사용처:

- 완전한 범용 기업 홈페이지 빌더
- 국내 쇼핑몰 풀패키지
- 무코드 WYSIWYG 페이지 빌더
- 월 몇천 원짜리 PHP 공유 호스팅
- 다수 고객을 한 프로세스에서 운영하는 멀티테넌트 SaaS
- Kubernetes를 전제로 한 대규모 분산 시스템

## 1.3 대표 제품 경험

NUBO가 먼저 압도해야 하는 세 가지 경험:

### A. 사진을 감상하는 경험

- 빠른 썸네일
- 레이아웃 흔들림이 없는 목록
- 몰입형 전체 화면 뷰어
- 키보드·마우스·터치 탐색
- 원본과 파생 이미지 정책
- EXIF와 장비 정보
- 세로·가로 사진 혼합 레이아웃
- 모바일에서 자연스러운 확대·이동
- 다음 사진 미리 불러오기
- 다크 모드에서 사진이 중심이 되는 화면

### B. 커뮤니티를 운영하는 경험

- 신고 처리함
- 회원 제재와 이력
- 관리자 감사 로그
- 게시판별 운영 권한
- 대량 이동·숨김·복구
- 스팸과 도배 제한
- 콘텐츠 버전과 휴지통
- 명확한 알림 정책
- 운영자가 실수해도 되돌릴 수 있는 관리 UI

### C. 설치하고 오래 운영하는 경험

- 서버에서 소스를 직접 빌드하지 않아도 되는 공식 배포본
- 한 명령 설치
- 업데이트 전 운영자 백업 확인과 명확한 데이터 경로 안내
- 헬스체크 실패 시 롤백
- 진단 명령
- 버전 호환성 경고
- 설정과 사용자 데이터가 릴리스 디렉터리 밖에 보존되는 구조

---

# 2. 제품 원칙

## 2.1 커뮤니티 우선

새 기능을 제안할 때 먼저 묻는다.

> “이 기능이 커뮤니티 참여, 콘텐츠 감상, 운영 안전성 중 하나를 실제로 개선하는가?”

답이 불명확하면 코어 기능으로 추가하지 않는다.

## 2.2 더하기보다 계약을 먼저 만든다

기능을 많이 넣기 전에 아래 계약을 명확히 한다.

- API 계약
- 권한 계약
- 이벤트 계약
- 스킨 슬롯 계약
- 모듈 매니페스트
- 데이터 마이그레이션 계약
- 버전 호환 계약
- 릴리스와 롤백 계약

## 2.3 운영 신뢰가 기능보다 먼저다

기능 추가보다 다음이 우선한다.

1. 보안
2. 인증과 권한
3. 데이터 무결성
4. 업데이트와 롤백
5. 자동 테스트
6. 관측성과 진단
7. 운영자 백업·복구 문서
8. 신규 기능

## 2.4 일반 사용자의 수정은 빌드 없이 가능해야 한다

사이트 이름, 로고, 색상, 메뉴, 홈 구성, 게시판 설정, 이메일, SEO, 기능 활성화처럼 흔한 수정은 관리자 화면이나 런타임 설정으로 처리한다.

Vue 코드나 Go 코드를 수정하는 것은 **Developer Mode**로 분리한다.

## 2.5 NUBO는 모듈러 모놀리스로 간다

당장 마이크로서비스로 분리하지 않는다.

- 하나의 NUBO 웹 프로세스
- 하나의 GOAPI 프로세스
- 하나의 데이터베이스
- 명확하게 분리된 도메인 모듈
- 외부 연동은 API와 Webhook으로 격리

확장성은 프로세스 수가 아니라 **도메인 경계와 계약**으로 확보한다.

## 2.6 Go 런타임 플러그인을 핵심 확장 방식으로 쓰지 않는다

Go의 `plugin` 패키지 기반 동적 로딩은 운영체제, 아키텍처, Go 버전, 빌드 옵션의 일치 요구가 강하다.

NUBO 확장은 다음 세 종류로 제한한다.

1. 빌드타임 공식/서드파티 모듈
2. 런타임 UI 블록과 설정
3. 외부 App/API/Webhook 연동

## 2.7 마이그레이션은 부가 도구가 아니라 제품이다

기존 커뮤니티가 NUBO로 이동할 때 다음을 잃지 않아야 한다.

- 회원
- 게시글
- 댓글
- 첨부파일
- 권한
- 비밀글
- 공지
- 추천
- URL
- 로그인 가능성
- 검색 엔진 평가

---

# 3. 우선순위와 상태 표기

## 3.1 우선순위

| 등급 | 의미 |
|---|---|
| `P0` | 다른 기능보다 먼저 해결해야 하는 안정성·보안·데이터 문제 |
| `P1` | Community OS의 핵심 경쟁력을 만드는 작업 |
| `P2` | 핵심 경험을 강화하거나 확장 생태계를 준비하는 작업 |
| `P3` | 수요와 운영 데이터가 확인된 후 진행할 선택 작업 |

## 3.2 상태

| 상태 | 의미 |
|---|---|
| `LOCKED` | 선행 퀘스트가 끝나지 않음 |
| `READY` | 지금 시작해도 됨 |
| `IN_PROGRESS` | 현재 작업 중 |
| `QA` | 구현 완료, 제품 소유자 검증 중 |
| `DONE` | 테스트와 QA까지 완료 |
| `DEFERRED` | 의도적으로 보류 |
| `DROPPED` | 방향과 맞지 않아 제거 |

## 3.3 작업 크기

| 크기 | 기준 |
|---|---|
| `S` | 한 저장소의 작은 독립 변경 |
| `M` | 여러 파일 또는 NUBO–GOAPI 계약 변경 |
| `L` | DB·API·UI·배포가 함께 바뀌는 에픽 |
| `XL` | 여러 릴리스에 걸쳐 쪼개야 하는 영역 |

크기는 일정 약속이 아니라 **작업 분할 필요성**을 판단하기 위한 값이다.

---

# 4. 모든 퀘스트의 공통 완료 조건

Codex가 코드를 작성했다고 퀘스트가 끝난 것이 아니다.

아래 항목 중 관련 있는 항목을 모두 만족해야 한다.

## 4.1 기능

- 요구사항과 실제 동작이 일치한다.
- 성공·빈 결과·실패·재시도·권한 없음 상태를 처리한다.
- 기존 정상 흐름을 깨지 않는다.
- 같은 요청이 중복 실행되어도 데이터가 손상되지 않는다.

## 4.2 보안과 권한

- 인증 여부만 확인하지 않고 대상 자원 권한을 확인한다.
- 다른 게시판·다른 회원·다른 첨부파일 ID를 바꿔 보내는 공격을 테스트한다.
- 관리자 기능은 서버에서 다시 권한을 검증한다.
- 입력값과 업로드 MIME을 신뢰하지 않는다.
- 로그에 비밀번호, JWT, 인증 코드, API 키가 남지 않는다.

## 4.3 SSR과 브라우저

- 직접 URL 접속에서 동작한다.
- 새로고침에서 동작한다.
- 서버 렌더링과 클라이언트 hydration 결과가 일치한다.
- 로그인·비로그인 SSR이 섞이지 않는다.
- Pinia의 요청별 상태가 다른 사용자에게 공유되지 않는다.
- 브라우저 전용 API는 `.client` 또는 적절한 가드로 분리한다.

## 4.4 UI/UX

- 모바일과 데스크톱을 확인한다.
- 키보드만으로 핵심 조작이 가능하다.
- 로딩·빈 상태·오류 상태가 있다.
- destructive action은 결과와 복구 가능성을 명확히 알린다.
- 클릭 후 중복 요청을 막는다.
- 운영자가 다음 행동을 알 수 있는 오류 문구를 제공한다.

## 4.5 테스트

- 수정한 버그의 회귀 테스트가 있다.
- GOAPI 변경은 관련 단위/통합 테스트와 `go test ./...`를 통과한다.
- 가능하면 `go vet ./...`를 통과한다.
- NUBO 변경은 lint, typecheck, 관련 테스트를 통과한다.
- 핵심 사용자 여정 변경은 Playwright 시나리오를 추가하거나 갱신한다.
- API 구조 변경은 contract test를 갱신한다.

## 4.6 운영

- 로그로 실패 원인을 추적할 수 있다.
- 스키마 변경은 반복 실행 가능하다.
- 업데이트 중 실패해도 기존 데이터가 보존된다.
- 필요한 경우 rollback 방법이 문서화되어 있다.
- 환경 변수나 설정 변경이 있으면 샘플과 관리자 안내를 갱신한다.

## 4.7 문서

- 사용자 동작이 바뀌면 README 또는 운영 문서를 갱신한다.
- 확장 계약이 바뀌면 manifest/schema 문서를 갱신한다.
- 호환성 또는 breaking change를 CHANGELOG에 기록한다.
- 해당 퀘스트의 체크박스와 상태를 갱신한다.

---

# 5. 전체 진행 맵

| 스테이지 | 이름 | 핵심 목표 | 해금 조건 |
|---|---|---|---|
| S0 | 튜토리얼 구역: 기반 안정화 | 보안·인증·SSR·테스트 기준 확립 | 현재 바로 시작 |
| S1 | 안전한 세이브 포인트 | 관측성·운영 절차·릴리스 신뢰 | S0 보스 완료 |
| S2 | 한 번에 서버 소환하기 | prebuilt와 `nuboctl` 설치/업데이트 | S1 핵심 완료 |
| S3 | 커뮤니티 관제실 | 권한·신고·제재·감사·스팸 대응 | S0 완료 후 병행 가능 |
| S4 | 사진 경험 최종 던전 | 미디어 파이프라인과 감상 UX | S1 및 저장소 정책 확정 |
| S5 | 확장팩 제작소 | 모듈·이벤트·Webhook·UI 슬롯 | S0/S1 계약 안정화 |
| S6 | 이주민을 위한 다리 | TSBOARD/G5/Rhymix 마이그레이션 | S2 설치 경험 확보 |
| S7 | 레이드 규모 확장 | 작업 큐·캐시·검색·다중 인스턴스 | 실제 부하 데이터 확보 |

---

# 6. S0 — 튜토리얼 구역: 기반 안정화

## 목표

기능 개발 속도를 유지하면서도 인증·권한·SSR·계약 회귀를 자동으로 잡는 기반을 만든다.

현재 `AGENTS.md`에 적힌 안정화 항목은 이 스테이지보다 우선한다.

- cross-board resource authorization
- signup/password-reset verification
- refresh-token behavior
- download-token concurrency
- legacy password migration
- blocked-user checks

## S0-Q01. 현재 보안 안정화 목록 완료

- 우선순위: `P0`
- 크기: `L`
- 상태: `DONE`
- 저장소: NUBO + GOAPI

### 작업

- [x] 게시판 ID와 게시글·댓글·첨부파일 ID를 교차 조작하는 핵심 서비스 테스트 추가
- [x] 대표 게시글·댓글·첨부파일의 자원 경계와 신고·회원 관리의 최고 관리자 경계 검증
- [x] 가입·비밀번호 초기화가 공유하는 인증 코드의 재사용·만료·다른 이메일 사용 차단
- [x] refresh token 동시 요청에서 이전 토큰이 한 번만 회전되는지 검증
- [x] 다운로드 토큰의 만료와 동시 1회 소비 검증
- [x] legacy password 최초 로그인 재해싱 검증
- [x] 정지·삭제된 계정이 기존 access token으로 인증되지 않는지 검증
- [x] 현재 범위에서 수정한 보안 결함을 같은 경계의 회귀 테스트로 고정

사용자 간 차단 관계가 글·댓글·알림·채팅에 미치는 정책은 S3에서 동작을 먼저 확정한 뒤 검증한다.
모든 handler 조합을 반복 테스트하지 않고, repository의 원자성·service 권한·대표 HTTP 경계 중
실패를 가장 빨리 드러내는 한 계층을 선택한다.

### 완료 조건

- 중요 자원별 권한 경계가 짧은 표 또는 테스트 이름으로 식별된다.
- 관련 테스트가 자동 실행된다.
- 잘못된 요청을 허용하기 위해 권한 검증을 약화하지 않는다.
- 프런트에서 숨기는 것과 별개로 GOAPI가 최종 권한을 판단한다.

## S0-Q02. 프런트엔드 테스트 하네스 구축

- 우선순위: `P0`
- 크기: `M`
- 상태: `DONE`
- 저장소: NUBO

### 권장 구성

- [x] Vitest
- [x] `@nuxt/test-utils`
- [x] Vue Test Utils
- [ ] Playwright — 핵심 브라우저 여정이 실제 회귀 위험이 될 때 도입
- [ ] 테스트 전용 DB와 최소 seed — DB 통합 경계가 필요한 시점에 함께 도입

### 단계적 진행

- [x] Phase 1: Node 단위 테스트와 Nuxt 런타임 테스트를 분리하고, 콘텐츠 유틸리티와 기본 스킨 registry를 검증
- [x] Phase 2: Nitro 인증 프록시의 refresh·cookie·본문 재전송 회귀 테스트
- [x] Phase 3: prebuilt runtime의 공개 SSR·정적 자산·GOAPI proxy smoke
- [ ] Phase 4: Playwright 핵심 사용자 여정 — 현재 범위에서는 보류

### 브라우저 하네스 도입 시 첫 대상

- 공개 홈·게시판·게시글 SSR
- 로그인과 access token refresh
- 글 작성과 대표 이미지 업로드

관리자·모바일·스킨 조합은 실제 변경이나 회귀가 생길 때 추가한다.

### 완료 조건

```bash
npm run test
npm run typecheck
npm run build
```

위 명령 체계가 문서화되고 재현 가능하다. `test:e2e`는 Playwright 도입 뒤에만 필수 게이트로 추가하며,
기존 전체 lint 부채는 변경 파일의 정확성을 흐리는 일괄 선행 조건으로 사용하지 않는다.

## S0-Q03. API 계약 목록과 응답 표준화

- 우선순위: `P0`
- 크기: `L`
- 상태: `DONE`
- 선행: S0-Q01 핵심 안정화

### 작업

- [x] 현재 Nitro `/api` 100개와 GOAPI 115개 엔드포인트 목록 생성
- [x] 프런트가 실제 소비하는 endpoint별 request/result 타입 대조
- [x] `Resp<T>`와 오류 응답의 필수 필드 정의
- [x] 인증 만료, 권한 부족, 검증 실패, 충돌의 v1 status/code 규칙 정의
- [x] 프런트와 백엔드가 공유할 contract version 도입
- [x] 공통 응답의 최소 machine-readable JSON Schema 도입
- [x] TypeScript 타입 자동 생성 가능성 검토 — 안정된 JSON 모델부터 후속 도입

현재 계약과 endpoint 목록은 `docs/API_CONTRACT_V1.md`, 공통 응답 schema는
`docs/contracts/api-response-v1.schema.json`을 기준으로 한다. v1은 기존 클라이언트 호환을 위해 application
오류의 HTTP 200 응답을 유지하며, HTTP 의미 전환은 contract version을 올리는 단일 migration으로 수행한다.

### 권장 오류 분류

| HTTP | 의미 |
|---:|---|
| 400 | 형식 오류 또는 해석 불가 |
| 401 | 로그인 필요 또는 세션 만료 |
| 403 | 로그인했지만 권한 없음 |
| 404 | 존재하지 않거나 노출하지 않을 자원 |
| 409 | 중복·상태 충돌 |
| 413 | 업로드 크기 초과 |
| 422 | 필드 검증 실패 |
| 429 | 속도 제한 |
| 500 | 예상하지 못한 서버 오류 |
| 503 | 일시적 의존 서비스 장애 |

## S0-Q04. 상태와 버전 엔드포인트

- 우선순위: `P1`
- 크기: `S`
- 상태: `DONE`
- 저장소: GOAPI + NUBO

### 엔드포인트

- [x] `/health`: 프로세스 생존
- [x] `/ready`: DB 등 필수 의존성 준비
- [x] `/version`: NUBO, GOAPI, API contract
- [x] release manifest에서 build commit 확인
- [x] 관리자 대시보드에서 버전 불일치 경고
- [x] Nitro 시작 시 GOAPI contract 호환성 확인

### 원칙

`health`는 가볍고 실패 원인을 노출하지 않는다. 상세 진단은 관리자 또는 로컬 `nuboctl doctor`에서만 보여준다. Kubernetes식 `z` 접미사는 NUBO의 독립 HTTP API에는 사용하지 않는다.

## S0-Q05. 기준 성능 측정

- 우선순위: `P1`
- 크기: `M`
- 상태: `DEFERRED`

### 시작 조건

- 실제 운영에서 응답 지연·메모리·업로드 병목이 관찰됨
- 미디어 파이프라인이나 검색 구조를 크게 변경함
- 단일 서버의 목표 동시 사용자 수를 정할 운영 데이터가 생김

### 기록

- 홈·게시판 목록·게시글 본문의 p50/p95
- Nitro·GOAPI RSS와 CPU
- 다중 이미지 업로드 시간과 실패율
- 관찰된 실제 부하에 가까운 동시 사용자 수

목표는 경쟁 제품을 이겼다고 홍보하는 것이 아니라, 이후 변경으로 성능이 얼마나 나빠졌는지 알 수 있게 하는 것이다.

## S0 보스 조건

- [x] 선택한 핵심 인증·권한 경계가 회귀 테스트와 함께 완료됨
- [x] 프런트 단위·Nuxt runtime·prebuilt SSR smoke 기반이 있음
- [x] API 오류 규칙이 문서화됨
- [x] `/health`, `/ready`, `/version`이 있음
- [ ] 실제 성능 작업 전 비교 가능한 최소 기준값을 저장함

### 해금

- 안정적인 공식 릴리스 자동화
- prebuilt 배포
- 커뮤니티 운영 기능의 안전한 확장

---

# 7. S1 — 안전한 세이브 포인트: 운영 신뢰

## 목표

장애가 발생해도 원인을 찾고, 업데이트가 실패해도 앱 릴리스를 복구하며, 운영자가 데이터 위치와 복구 절차를 이해할 수 있는 제품을 만든다.

## S1-Q01. 구조화 로그와 Request ID

- 우선순위: `P1`
- 크기: `M`
- 상태: `LOCKED`
- 선행: S0-Q04

### 로그 필드

- timestamp
- level
- service
- request_id
- route
- method
- status
- duration_ms
- actor_uid
- board_uid
- error_code
- build_version

### 금지

- JWT
- refresh token
- 비밀번호
- 인증 코드
- API key
- 메일 본문
- 민감한 개인정보 전체

Nitro가 생성한 request ID를 GOAPI까지 전달하고, 양쪽 로그를 한 요청으로 추적할 수 있게 한다.

## S1-Q02. 오류 분류와 운영자 안내

- 우선순위: `P1`
- 크기: `M`

- [ ] 사용자용 오류 문구와 운영 로그 분리
- [ ] 외부 서비스 장애와 내부 버그 분리
- [ ] 관리자 화면에 최근 시스템 오류 요약
- [ ] 지원 요청용 진단 ID 제공
- [ ] 동일 오류 폭주 시 로그 억제 또는 집계

## S1-Q03. 운영자 백업·복구 가이드

- 우선순위: `P1`
- 크기: `S`

### 책임 경계

- DB dump, 업로드 파일과 설정의 복사·전송·보관·주기·보존 정책은 서버 운영자 또는 호스팅 환경이 책임진다.
- NUBO는 백업 엔진, 백업 저장소, SFTP 전송, 예약 실행 기능을 제공하지 않는다.
- NUBO는 데이터 위치, 버전 호환성, 업데이트 전 확인 사항과 일반적인 복구 순서를 문서화한다.
- NUBO의 진단 정보와 로그에는 평문 비밀키나 백업 원문을 포함하지 않는다.

### 문서 범위

- `mysqldump` 또는 `mariadb-dump`를 이용한 DB 백업 예시
- 업로드, 환경 설정, 사이트 Layer 등 보존할 경로
- SFTP·`rsync` 등 일반 도구를 사용할 때의 권한과 비밀정보 주의사항
- DB, 파일, 설정, 호환 버전 순서의 복구 체크리스트
- 업데이트 전 운영자 확인 목록과 호환되지 않는 migration 경고

### 완료 조건

- [ ] 지원 환경 기준 데이터 위치가 한 문서에 정리됨
- [ ] DB와 파일의 백업·복구 예시가 특정 호스팅 업체에 종속되지 않음
- [ ] fresh 환경에서 문서의 복구 순서를 검증함
- [ ] 앱 롤백과 DB 복구가 서로 다른 책임임을 명시함
- [ ] 암호화되지 않은 비밀키가 진단 출력에 포함되지 않음

## S1-Q04. 원자적 업데이트와 롤백 설계

- 우선순위: `P0`
- 크기: `XL`
- 상태: `DONE`

### 핵심 원칙

- 설정과 데이터는 릴리스 디렉터리 밖에 둔다.
- 새 버전은 새 디렉터리에 풀고 검증 후 `current` symlink를 전환한다.
- DB migration은 backward-compatible 단계를 우선한다.
- 앱 전환 실패 시 이전 릴리스로 되돌린다.
- destructive migration은 별도 릴리스에서 충분한 유예 후 실행한다.
- 여기서 자동 롤백은 앱 릴리스 전환을 뜻하며, DB를 과거 상태로 자동 복원하지 않는다.
- 업데이트 도구는 운영자의 백업 확인을 요구할 수 있지만 백업을 대신 생성하거나 보관하지 않는다.

### 권장 디렉터리

```text
/opt/nubo/
├── releases/
│   ├── 1.2.2/
│   └── 1.3.0/
├── current -> /opt/nubo/releases/1.3.0
└── bin/nuboctl

/etc/nubo/
└── nubo.env

/var/lib/nubo/
├── upload/
└── state/

/var/log/nubo/
├── web.log
└── api.log
```

## S1-Q05. `nuboctl doctor`

- 우선순위: `P1`
- 크기: `M`

### 검사 항목

- [x] OS/CPU 아키텍처
- [ ] 메모리·디스크
- [x] Node 또는 번들 Node
- [x] 릴리스에 포함된 x86-64 호환·x86-64-v2 최적화 libvips 자동 선택
- [ ] MySQL/MariaDB 연결
- [ ] DB charset와 권한
- [ ] 포트 충돌
- [x] upload 쓰기 권한
- [ ] 도메인·HTTPS
- [ ] Nginx proxy header
- [ ] NUBO–GOAPI 버전 호환
- [ ] 메일 provider 설정
- [ ] 운영자 백업·복구 문서와 데이터 경로 안내
- [ ] 최근 실패한 migration
- [x] health/readiness

출력은 `PASS`, `WARN`, `FAIL`로 나누고 바로 실행할 수정 명령을 제공한다.

## S1-Q06. 릴리스 정책

- 우선순위: `P1`
- 크기: `S`

### 버전

- NUBO frontend version
- GOAPI version
- API contract version
- skin manifest schema version
- module manifest schema version

### 릴리스 채널

- `stable`
- `preview`
- `nightly` 또는 `edge`는 필요할 때만

### 규칙

- stable 릴리스는 자동 테스트와 fresh-install smoke test를 통과해야 한다.
- breaking change는 migration과 rollback 설명이 있어야 한다.
- 보안 릴리스는 영향 버전과 완화책을 명확히 적는다.
- NUBO와 GOAPI 조합을 compatibility matrix로 제공한다.

## S1 보스 조건

- [ ] 요청을 양쪽 프로세스에서 추적할 수 있음
- [ ] 운영자가 보존해야 할 데이터와 일반 복구 절차가 문서화됨
- [ ] 업데이트 실패 시 이전 버전으로 돌아갈 수 있음
- [ ] `nuboctl doctor`가 대표 설치 오류를 발견함
- [ ] 버전과 호환 정책이 문서화됨

---

# 8. S2 — 한 번에 서버 소환하기: Prebuilt와 설치

## 목표

운영 서버에서 `npm install`과 `nuxt build`를 수행하지 않아도 NUBO를 설치할 수 있게 한다.

사이트별 코드 수정이 필요한 개발자는 별도 **Developer Mode**를 사용한다.

## 8.1 현재 배포 전략

### No-build release

현재 완성할 유일한 공식 배포 방식이다.

운영 서버 요구사항:

- Node LTS
- MySQL/MariaDB
- Nginx

공식 릴리스에 포함:

- Nuxt `.output`
- Ubuntu 22.04 호환 `goapi-linux`
- sharp-libvips 기반 `libvips`와 라이선스 자료
- `env.sample`
- systemd 예제
- Nginx 예제
- checksums
- release manifest

운영자는 Node를 설치하지만 소스 빌드는 하지 않는다. Node 번들, 컨테이너, 다른 배포판 지원은 현재 목표에 포함하지 않는다.

## S2-Q01. Prebuilt Nuxt 산출물 PoC

- 우선순위: `P0`
- 크기: `M`
- 상태: `DONE`
- 선행: S0 테스트 기반

### 작업

- [x] clean checkout에서 `npm ci`
- [x] 변경 파일 lint와 전체 typecheck/test (전체 lint의 기존 358건은 별도 finding으로 유지)
- [x] `nuxt build`
- [x] `.output`만 별도 서버로 복사
- [x] 소스와 루트 `node_modules` 없이 실행
- [x] fresh Ubuntu 22.04/24.04 smoke test
- [x] runtimeConfig가 배포 후 환경 변수로 정상 반영되는지 확인
- [x] 정적 자산과 외부 upload 경로 확인

## S2-Q02. 통합 릴리스 번들

- 우선순위: `P0`
- 크기: `L`
- 상태: `DONE`

### 완료된 기반

- [x] 릴리스 외부의 단일 환경 파일을 GOAPI와 prebuilt Nuxt가 공유하는 런타임 계약
- [x] 공식 GOAPI 빌드, Nuxt `.output`, 환경 샘플, 독립적인 컴포넌트 provenance, checksum을 포함한 최소 통합 archive와 Ubuntu 24.04 재검증
- [x] 설치 경로와 업로드 경로를 렌더링할 수 있는 systemd와 Nginx 템플릿

### 권장 산출물

```text
nubo-1.3.0-linux-amd64.tar.zst
├── bin/
│   └── goapi
├── lib/
│   ├── libvips-cpp.so.8.18.3
│   └── glibc-hwcaps/x86-64-v2/
│       └── libvips-cpp.so.8.18.3
├── licenses/
│   └── sharp-libvips/
├── web/
│   └── .output/
├── share/
│   ├── env.sample
│   ├── systemd/
│   ├── nginx/
│   └── THIRD_PARTY_LICENSES
├── manifest.json
├── checksums.txt
└── nuboctl
```

### 현재 GOAPI 빌드 원칙

GOAPI의 공식 x86-64 바이너리는 반드시 `scripts/build-ubuntu22.sh` 산출물을 사용한다. 호스트에서 직접 빌드한 바이너리를 공식 번들에 넣지 않는다.
sharp-libvips의 고정 소스로 만든 x86-64 호환판과 공식 x86-64-v2판을 함께 넣고 상대 RPATH로 참조한다.
glibc가 CPU에 맞게 자동 선택하며 운영 서버에는 libvips 패키지를 설치하지 않는다.

## S2-Q03. `nuboctl` MVP

- 우선순위: `P0`
- 크기: `XL`
- 상태: `DONE`

### 완료된 기반

- [x] Phase 1 읽기 전용 `doctor`와 `status`: 플랫폼·런타임·release checksum·환경/업로드·systemd·Nginx·HTTP 상태 진단
- [x] Phase 2 설치 준비: dry-run, 사전 검사, 경로/환경 생성, systemd/Nginx 렌더링, 기존 설정 보호
- [x] Phase 3 update 기반: 운영자 배치 릴리스 검증, 외부 백업 확인, additive migration, 원자적 전환과 readiness 실패 복구

### 사용자 계약

- 사람이 `nuboctl install`을 실행하면 한국어 대화형 안내를 기본으로 제공한다.
- AI와 자동화는 `--non-interactive` 옵션 및 번들 안의 `INSTALL_GUIDE_FOR_AI.md`를 사용한다.
- 비밀번호와 비밀값은 명령행 인자로 받지 않고 숨김 입력 또는 권한이 제한된 입력 파일로 받는다.
- 자동으로 알아낼 수 있는 값은 묻지 않고, 실행 전 계획과 실행 후 다음 행동을 분명하게 보여준다.
- `nuboctl`은 범용 서버 관리자가 아니라 NUBO 실행에 필요한 최소 환경을 준비하고 진단하는 도구다.

큰 명령 집합을 한 번에 구현하지 않는다. 각 단계는 실제 운영에서 검증한 뒤 다음 단계로 확장한다.

### Phase 1 — 진단

```bash
nuboctl doctor
nuboctl status
```

### Phase 2 — 설치와 프로세스 제어

```bash
nuboctl install
systemctl restart nubo
journalctl -u nubo-goapi -u nubo-web
```

### Phase 3 — 릴리스 전환

```bash
nuboctl update
```

백업과 복구는 `nuboctl`의 책임이 아니다. 업데이트는 운영자가 외부 도구로 백업했음을 확인하고, 데이터 경로와 복구 문서를 안내한다.

### `install`

- [x] 사전 검사
- [x] 경로 생성
- [x] 환경 설정 입력
- [x] DB 준비
- [x] GOAPI install 실행
- [x] systemd unit 설치
- [x] reverse proxy 템플릿 생성
- [x] healthcheck
- [x] 최초 관리자 URL 표시

### `update`

1. [x] 현재 상태와 checksum 검사
2. [x] 운영자 외부 백업 확인과 호환성 경고
3. [x] 공개 update의 새 릴리스 다운로드·checksum 검증·압축 해제·배치
4. [x] 같은 releases 디렉터리의 더 높은 버전과 운영 템플릿 호환성 확인
5. [x] DB additive migration
6. [x] 런타임 버전과 current symlink 원자적 전환
7. [x] 서비스 restart와 readiness 확인
8. [x] 실패 시 이전 환경·링크·프로세스 복구

## S2-Q04. GitHub Actions 릴리스 파이프라인

- 우선순위: `P1`
- 크기: `L`

### 파이프라인

- [x] NUBO와 GOAPI exact ref checkout
- [ ] NUBO lint/typecheck/test/build
- [ ] GOAPI test/vet
- [x] Ubuntu 22.04 빌드 스크립트
- [ ] contract version 일치 검사
- [x] 패키징
- [ ] Ubuntu 22.04 fresh install smoke
- [ ] Ubuntu 24.04 fresh install smoke
- [x] checksums
- [x] GitHub Release 업로드

### 태그 전략

두 저장소의 버전이 항상 같아야 한다고 가정하지 않는다. release manifest가 실제 조합을 기록한다.

```json
{
  "nubo": "1.3.0",
  "goapi": "1.4.1",
  "api_contract": "v1",
  "skin_schema": 1,
  "module_schema": 1,
  "commit": {
    "nubo": "...",
    "goapi": "..."
  }
}
```

## S2-Q05. Container 배포

- 우선순위: `P2`
- 크기: `L`
- 상태: `DEFERRED`

현재 대상 사용자의 설치 경험을 개선하지 않으므로 구현 범위에서 제외한다. 실제 컨테이너 배포 수요가 확인될 때 새 범위를 합의한다.

## S2-Q06. 사이트별 수정과 prebuilt의 공존

- 우선순위: `P1`
- 크기: `L`
- 상태: `DONE`

### 완료된 기반

- [x] 로컬 스킨 변경을 typecheck·production build하고 공식 기반과 별도 파생 릴리스로 결합
- [x] 같은 버전의 Web만 원자적으로 전환하고 readiness 실패 시 이전 Web으로 복구
- [x] 설치·전환 뒤 PATH에서 현재 버전의 `nuboctl`을 실행하는 보호된 링크
- [ ] 사이트 Layer 자동 재빌드 — 실제 다수 사이트의 반복 수요가 생길 때 검토
- [ ] 런타임 Theme Mode와 외부 스킨 카탈로그 — 현재 범위에서 보류

공식 prebuilt가 모든 사이트별 Vue 코드를 포함할 수는 없다. 따라서 사용 모드를 세 단계로 분리한다.

### Standard Mode — 빌드 없음

관리자에서 변경:

- 사이트 이름
- 로고·favicon
- 색상·폰트·간격 token
- 메뉴
- 홈 화면 블록
- 활성 게시판
- 알림
- 가입 정책
- 이메일
- SEO
- 이미지 크기와 업로드 정책
- 지원되는 runtime theme

이 사용자는 공식 prebuilt를 그대로 업데이트한다.

### Theme Mode — 제한된 런타임 확장

- 검증된 디자인 token
- 허용된 UI block
- 레이아웃 JSON 또는 block config
- 사용자 JavaScript 실행 금지
- DB 또는 안전한 파일로 저장
- Nuxt 재빌드 없음

### Developer Mode — custom build

완전한 Vue 컴포넌트나 Nuxt Layer를 사용한다.

권장 구조:

```text
nubo-site/
├── nubo.site.json
├── layer/
│   ├── app/
│   └── nuxt.config.ts
└── patches/                # 가능하면 비워둔다
```

원칙:

- NUBO core를 직접 수정하지 않는다.
- 사이트 코드는 별도 저장소 또는 Layer에 둔다.
- `nuboctl build-custom` 또는 CI가 base version과 site layer를 조합한다.
- custom artifact manifest에 base NUBO 버전을 기록한다.
- 업데이트 전에 Layer 호환 테스트를 수행한다.

## S2 보스 조건

- [x] 운영 서버에서 소스 빌드 없이 설치 가능
- [x] fresh Ubuntu와 Cafe24 가상서버에서 설치·update·기본 이미지 처리 확인
- [x] update와 readiness 실패 시 이전 앱 릴리스 자동 복구 동작
- [x] Standard Mode 사용자는 코어 파일을 수정하지 않음
- [x] Developer Mode가 별도 파생 릴리스로 공식 기반과 분리됨
- [x] 릴리스 산출물의 checksum과 버전 조합을 확인할 수 있음

독립 `rollback` 명령과 범용 프로세스 제어 명령은 현재 완료 조건이 아니다. 앱 전환 중 실패는 자동
복구하고, 정상 실행 중 운영은 systemd를 사용하며, DB 복구는 운영자 백업 책임으로 유지한다.

---

# 9. S3 — 커뮤니티 관제실: 운영 기능

## 목표

클리앙·다모앙·퀘이사존·오늘의유머 같은 장기 운영 커뮤니티가 필요로 하는 관리 기능의 기반을 만든다.

모든 기능을 한 번에 복제하지 않는다. 운영자가 매일 반복하는 위험한 작업부터 해결한다.

## S3-Q01. Capability + Scope 권한 모델

- 우선순위: `P0`
- 크기: `XL`

### 예시 capability

```text
board.post.create
board.post.edit.own
board.post.edit.any
board.post.delete.own
board.post.delete.any
board.post.move
board.comment.moderate
moderation.report.view
moderation.report.resolve
moderation.sanction.issue
user.note.write
audit.view
```

### Scope

- global
- board group
- board
- own resource

### 원칙

- 숫자 레벨 하나로 모든 권한을 표현하지 않는다.
- UI 표시와 서버 권한 검증에 같은 capability 정의를 사용한다.
- 게시판 관리자는 전체 사이트 관리자가 아니어도 된다.
- 권한 변경은 감사 로그에 남는다.

## S3-Q02. 관리자 감사 로그

- 우선순위: `P0`
- 크기: `L`

### 기록 대상

- 회원 권한 변경
- 회원 정지·해제
- 게시글 이동·숨김·삭제·복구
- 신고 처리
- 게시판 설정 변경
- 가입 정책 변경
- 스킨/모듈 활성화
- 대량 메일 발송
- 업데이트·롤백
- API key 생성·폐기

### 필드

- event id
- actor
- action
- target type/id
- before summary
- after summary
- reason
- request id
- IP의 최소 필요 정보
- created_at

감사 로그는 일반 CRUD 테이블처럼 수정하지 않는다. 정정이 필요하면 별도 정정 이벤트를 추가한다.

## S3-Q03. 신고 Case Workflow

- 우선순위: `P1`
- 크기: `L`

### 상태

```text
open -> investigating -> resolved
                     -> dismissed
                     -> escalated
```

### 기능

- [ ] 게시글·댓글·회원 신고
- [ ] 중복 신고 묶기
- [ ] 사유 코드와 자유 입력
- [ ] 운영자 내부 메모
- [ ] 담당자 지정
- [ ] 처리 결과
- [ ] 신고자에게 선택적 알림
- [ ] 대상 콘텐츠 snapshot
- [ ] 감사 로그 연결

## S3-Q04. 회원 제재

- 우선순위: `P1`
- 크기: `L`

### 제재 종류

- 경고
- 글쓰기 제한
- 댓글 제한
- 특정 게시판 제한
- 채팅 제한
- 기간 정지
- 영구 정지

### 필수 정책

- 시작·종료 시각
- 사유
- 운영자 메모
- 사용자에게 보여줄 문구
- 자동 해제
- 이의 제기 링크
- 중복 제재 결합 규칙
- 감사 로그

## S3-Q05. 대량 운영 도구

- 우선순위: `P1`
- 크기: `M`

- [ ] 게시글 다중 선택
- [ ] 이동
- [ ] 숨김
- [ ] 복구
- [ ] 태그/분류 변경
- [ ] 댓글 잠금
- [ ] 회원 일괄 권한 변경
- [ ] 결과 preview
- [ ] 실행 전 대상 수 표시
- [ ] 부분 실패 보고
- [ ] idempotency

## S3-Q06. 스팸·도배·남용 방지

- 우선순위: `P1`
- 크기: `L`

### 1단계

- IP/회원/엔드포인트 rate limit
- 신규 회원 글·링크 제한
- 동일 본문 반복 탐지
- 금칙어
- 허용되지 않은 URL scheme 차단
- 로그인 실패 제한
- 파일 MIME·확장자·크기 검증

### 2단계

- 신뢰도 기반 제한
- 도메인 reputation
- 신고 누적
- 관리자가 조정 가능한 규칙
- 외부 anti-spam provider 연동

처음부터 복잡한 AI moderation을 코어 필수 기능으로 넣지 않는다.

## S3-Q07. Soft Delete, 휴지통, 콘텐츠 버전

- 우선순위: `P1`
- 크기: `L`

- [ ] 운영자 삭제와 작성자 삭제 구분
- [ ] 삭제 사유
- [ ] 복구 기한
- [ ] 첨부파일 보존 정책
- [ ] 게시글 수정 이력
- [ ] 중요한 설정 변경 이력
- [ ] 법적 삭제와 일반 휴지통 분리
- [ ] 목록·검색·알림에서 삭제 상태 일관성

## S3-Q08. 알림 구독 정책

- 우선순위: `P2`
- 크기: `M`

사용자가 선택:

- 내 글의 댓글
- 내 댓글의 답글
- 멘션
- 좋아요
- 운영 공지
- 신고 결과
- 채팅
- 이메일/사이트 알림 채널

운영자는 강제 공지와 선택 알림을 구분한다.

## S3-Q09. 개인정보와 계정 수명주기

- 우선순위: `P1`
- 크기: `L`

- [ ] 내 데이터 export
- [ ] 계정 탈퇴
- [ ] 콘텐츠 유지/익명화 정책
- [ ] 개인정보 보존 기간
- [ ] 관리자 메모 접근 제한
- [ ] 감사 로그의 개인정보 최소화
- [ ] 업로드 EXIF 개인정보 정책
- [ ] 운영자 백업에 남은 삭제 데이터의 취급 책임 문서화

## S3 보스 조건

- [ ] 게시판 관리자가 DB나 서버 쉘 없이 신고를 처리함
- [ ] 모든 제재와 관리자 변경을 추적할 수 있음
- [ ] 실수로 숨긴 콘텐츠를 복구할 수 있음
- [ ] 권한이 global/board/own 범위로 구분됨
- [ ] 도배 공격이 단일 설정으로 완화됨
- [ ] 운영자가 대량 작업 결과를 검증할 수 있음

---

# 10. S4 — 사진 경험 최종 던전

## 목표

“사진 커뮤니티라면 NUBO”라는 인식을 만들 수 있는 대표 경험을 완성한다.

## S4-Q01. Storage 인터페이스

- 우선순위: `P0`
- 크기: `L`

### 초기 구현

- local filesystem

### 이후 구현

- S3-compatible object storage
- CDN URL
- private object signed URL

### 필요한 계약

```text
Put
Open
Delete
Exists
PublicURL
SignedURL
Move
Stat
```

DB에는 물리 경로만 저장하지 않고 storage provider와 object key를 저장하는 방향을 검토한다.

## S4-Q02. 이미지 파생본 파이프라인

- 우선순위: `P0`
- 크기: `XL`

### 파생본

- thumbnail
- list/card
- content
- full-screen
- original

### 고려 사항

- AVIF/WebP/JPEG fallback
- orientation
- ICC profile 보존 또는 명시적 변환
- animated image 정책
- transparency
- metadata 제거 정책
- no-upscale
- 품질 설정
- 파생본 재생성
- 실패 상태와 재시도
- 중복 업로드 hash

### 원칙

목록에서 원본을 내려보내지 않는다. 이미지 크기를 HTML/CSS에 미리 알려 CLS를 막는다.

## S4-Q03. 업로드 세션

- 우선순위: `P0`
- 크기: `XL`

현재처럼 토큰 만료 재시도를 위해 multipart 전체를 Nitro 메모리에 보관하는 방식은 대용량·동시 업로드에서 한계가 있다.

### 목표 구조

1. 업로드 세션 생성
2. 세션 인증 확인
3. 파일별 임시 ID 발급
4. 직접 또는 chunk 업로드
5. checksum 검증
6. 파생본 생성
7. 글 저장 시 첨부 ID 연결
8. 미사용 임시 파일 정리

### 단계적 구현

- Phase 1: 업로드 직전 refresh, 업로드 요청은 자동 재시도하지 않음
- Phase 2: temporary upload ID
- Phase 3: S3 presigned/chunk upload

## S4-Q04. 몰입형 사진 뷰어

- 우선순위: `P1`
- 크기: `L`

### 데스크톱

- 좌우 키
- ESC
- 확대/축소
- 1:1 보기
- 화면 맞춤
- 다음 사진 preload
- 브라우저 history와 닫기 동작
- 캡션·EXIF 토글

### 모바일

- swipe
- pinch zoom
- double tap
- 세로/가로 회전
- 안전한 body scroll lock
- 브라우저 back으로 닫기

### 접근성

- focus trap
- 명확한 label
- 이미지 대체 텍스트
- reduced motion
- 키보드 순서

## S4-Q05. EXIF와 개인정보

- 우선순위: `P1`
- 크기: `M`

- [ ] 카메라
- [ ] 렌즈
- [ ] 초점거리
- [ ] 조리개
- [ ] 셔터
- [ ] ISO
- [ ] 촬영 시각
- [ ] GPS는 기본 비공개 또는 제거
- [ ] 작성자 공개 선택
- [ ] 원본 다운로드 시 metadata 정책
- [ ] 검색 filter에 사용할 정규화 필드

## S4-Q06. 미디어 라이브러리

- 우선순위: `P2`
- 크기: `XL`

- 내 업로드
- 게시글 연결 상태
- 미사용 파일
- 용량
- 검색
- 촬영 장비 filter
- 대량 선택
- 재사용
- 삭제 영향 preview
- 파생본 재생성

## S4-Q07. 사진 탐색

- 우선순위: `P1`
- 크기: `L`

- 카메라/렌즈/태그
- 가로/세로
- 최신/추천/댓글/조회
- 앨범·시리즈
- 작성자 갤러리
- 관련 사진
- 무한 스크롤은 canonical pagination과 함께 사용
- URL을 잃지 않는 필터

## S4-Q08. 성능 예산

- 우선순위: `P1`
- 크기: `M`

대표 모바일 환경에 대한 목표값을 문서화한다.

예시 목표:

- CLS < 0.1
- 대표 공개 페이지 LCP < 2.5s
- 목록 첫 화면에 원본 이미지 없음
- 뷰어 첫 사진 외 인접 사진만 제한적으로 preload
- 이미지 decode 실패 fallback
- route 이동 후 불필요한 요청 취소
- 서버와 CDN cache policy 명시

## S4 보스 조건

- [ ] 사진 목록에서 레이아웃이 흔들리지 않음
- [ ] 데스크톱과 모바일 전체 화면 뷰어가 자연스러움
- [ ] 원본/파생본/EXIF 정책이 관리자에게 보임
- [ ] 대용량 업로드가 토큰 재시도로 중복 저장되지 않음
- [ ] 카메라·렌즈 기반 탐색이 가능함
- [ ] 사진 페이지가 NUBO의 대표 데모로 공개 가능함

---

# 11. S5 — 확장팩 제작소: 모듈 시스템

## 목표

NUBO core를 수정하지 않고도 새로운 도메인 기능을 추가할 수 있는 계약을 만든다.

## 11.1 확장 종류

| 종류 | 데이터 소유 | 권한 소유 | 재빌드 | 예 |
|---|---:|---:|---:|---|
| Skin/Theme | 아니오 | 아니오 | 완전한 Vue 스킨은 필요 | 레이아웃, 색상, 목록 표현 |
| Runtime Block | 제한적 | 아니오 | 불필요 | 최신글, 배너, 공지 블록 |
| Compiled Module | 예 | 예 | 필요 | 설문, 일정, 중고거래 |
| External App | 외부 또는 API | capability token | 불필요 | 알림톡, 검색, 결제 |
| Provider | 설정/어댑터 | 제한적 | 구현에 따라 다름 | Storage, Mail, OAuth |

## 11.2 무엇이 코어인가

코어에 포함할 것:

- 사용자와 인증
- 기본 게시판과 댓글
- 공통 권한 체계
- 신고·제재·감사
- 알림 정의와 전달 기반
- 파일·스토리지 계약
- 모듈 registry
- 이벤트와 migration 기반
- 관리자 공통 shell

모듈로 뺄 것:

- 설문
- 캘린더
- 제품 사전
- 게임 사전
- 중고거래
- 포인트/배지의 고급 정책
- 특정 외부 서비스
- 커머스

## S5-Q01. 확장 ADR 작성

- 우선순위: `P0`
- 크기: `M`

최소 ADR:

- [ ] Skin vs Runtime Block vs Module vs External App
- [ ] 빌드타임과 런타임 확장의 경계
- [ ] Go `plugin`을 사용하지 않는 이유
- [ ] module versioning
- [ ] UI slot 안정성
- [ ] DB migration 소유권
- [ ] module 제거 시 데이터 정책

## S5-Q02. GOAPI Module Registry 골격

- 우선순위: `P1`
- 크기: `L`

기존 `repositories -> services -> handlers -> routers` 조립 구조를 한 번에 전부 재작성하지 않는다.

신규 모듈부터 vertical slice를 시도한다.

```text
internal/modules/poll/
├── module.go
├── contracts.go
├── repository.go
├── service.go
├── handler.go
├── routes.go
├── permissions.go
├── events.go
└── migrations/
```

개념 인터페이스 예시:

```go
type Module interface {
    ID() string
    Version() string
    RegisterRoutes(router fiber.Router, app *AppContext)
    Permissions() []PermissionDefinition
    Migrations() []Migration
    Subscribers() []EventSubscriber
}
```

이 인터페이스는 초안이며, 실제로 필요하지 않은 메서드는 억지로 넣지 않는다.

## S5-Q03. Module Manifest v1

- 우선순위: `P1`
- 크기: `M`

```json
{
  "schema_version": 1,
  "id": "org.nubo.poll",
  "name": "NUBO Poll",
  "version": "0.1.0",
  "kind": "compiled",
  "requires": {
    "nubo": ">=1.5.0 <2.0.0",
    "goapi": ">=1.5.0 <2.0.0",
    "api_contract": "v1"
  },
  "capabilities": [
    "poll.create",
    "poll.vote",
    "poll.manage"
  ],
  "publishes": [
    "poll.created",
    "poll.closed"
  ],
  "subscribes": [
    "post.deleted"
  ],
  "ui_slots": [
    "board.write.after",
    "post.view.after"
  ],
  "settings_schema": "settings.schema.json"
}
```

### 검증

- ID 형식
- SemVer
- 호환 버전
- capability 충돌
- event version
- migration 순서
- UI slot 존재
- 제거 가능 여부

## S5-Q04. UI Slot 계약

- 우선순위: `P1`
- 크기: `L`

예시:

```text
layout.header.after
layout.sidebar.main
home.main
board.list.before
board.list.after
board.write.after
post.view.before
post.view.after
profile.tabs
admin.navigation
admin.dashboard
```

원칙:

- 슬롯 이름은 공개 API로 취급한다.
- 의미가 겹치는 슬롯을 무분별하게 추가하지 않는다.
- 렌더링 순서와 priority 규칙을 정의한다.
- 슬롯에 주입되는 context 타입을 문서화한다.
- 권한 없는 블록은 서버 또는 provider 단계에서 제거한다.

## S5-Q05. Domain Event + Outbox

- 우선순위: `P1`
- 크기: `XL`

### 이벤트 envelope

```json
{
  "id": "uuid",
  "type": "post.created",
  "version": 1,
  "occurred_at": "2026-08-17T12:00:00Z",
  "actor_uid": 123,
  "request_id": "...",
  "data": {
    "board_uid": 10,
    "post_uid": 999
  }
}
```

### 원칙

- DB transaction과 이벤트 기록을 분리해 잃어버리지 않는다.
- 이벤트는 outbox에 먼저 저장한다.
- 외부 Webhook은 재시도한다.
- delivery ID와 idempotency key를 제공한다.
- payload에 불필요한 개인정보를 넣지 않는다.
- breaking event는 version을 올린다.

## S5-Q06. External App와 Webhook

- 우선순위: `P2`
- 크기: `L`

- capability 기반 API token
- HMAC signature
- delivery timestamp
- replay 방지
- endpoint별 secret 회전
- retry/backoff
- dead-letter
- 관리자 delivery log
- test delivery
- endpoint 비활성화

External App 예:

- 카카오 알림톡
- Discord/Slack 알림
- 외부 검색
- AI tagging
- 이미지 분석
- 결제

## S5-Q07. 설정 Schema

- 우선순위: `P1`
- 크기: `M`

모듈 설정을 임의 HTML 폼으로 만들지 않고 JSON Schema와 UI hint로 표현한다.

- 타입 검증
- 기본값
- secret 표시 금지
- server-only 값
- 환경 변수 override
- 변경 감사 로그
- module 제거 시 보존 정책

## S5-Q08. 첫 샘플 모듈: Poll

- 우선순위: `P1`
- 크기: `L`

Poll은 모듈 계약을 검증하기 좋은 작은 기능이다.

검증 항목:

- DB migration
- capability
- API
- UI slot
- 작성·투표·마감
- 게시글 삭제 event
- 관리자 설정
- 테스트
- 제거 정책

첫 모듈로 커머스를 선택하지 않는다.

## S5-Q09. 기존 Trade 기능의 모듈화 검토

- 우선순위: `P2`
- 크기: `XL`

중고거래는 NUBO 방향과 맞지만 이미 존재하는 기능을 무리하게 재작성하지 않는다.

Poll 모듈에서 계약이 검증된 후 다음을 평가한다.

- 거래 상태
- 가격/지역/배송
- 작성·수정·목록·뷰
- 게시판 코어 의존
- 모듈 비활성화
- 기존 데이터 migration
- 하위 호환

## S5 보스 조건

- [ ] 신규 모듈이 core 파일의 임의 수정 없이 등록됨
- [ ] capability, migration, event, UI slot이 manifest로 설명됨
- [ ] Poll 모듈이 설치·활성화·비활성화됨
- [ ] 외부 App이 서명된 Webhook을 받음
- [ ] 모듈 버전 불일치가 시작 전에 감지됨
- [ ] arbitrary Go binary/plugin을 런타임에 로딩하지 않음

---

# 12. S6 — 이주민을 위한 다리: 마이그레이션

## 목표

“NUBO가 좋아 보여도 기존 데이터를 옮길 수 없다”는 가장 큰 도입 장벽을 제거한다.

## 12.1 공통 Migration Engine

### 단계

```text
analyze -> map -> dry-run -> import -> verify -> redirect -> report
```

### 공통 요구사항

- source adapter
- target writer
- resumable cursor
- batch transaction
- file checksum
- ID mapping
- retry
- partial failure
- dry-run
- final reconciliation
- redirect map
- migration report

## S6-Q01. TSBOARD importer 안정화

- 우선순위: `P0`
- 크기: `M`

NUBO가 계승한 데이터 구조를 가장 먼저 완성된 reference importer로 만든다.

- [ ] 회원
- [ ] 게시판
- [ ] 글
- [ ] 댓글
- [ ] 첨부
- [ ] 비밀글
- [ ] 공지
- [ ] 추천
- [ ] 태그
- [ ] URL
- [ ] 비밀번호
- [ ] 개수 검증
- [ ] 중단 후 재개

## S6-Q02. Gnuboard 5 Analyzer

- 우선순위: `P1`
- 크기: `L`

실제 import 전에 읽기 전용 분석부터 제공한다.

출력 예:

```text
Users: 120,341
Boards: 48
Posts: 4,281,090
Comments: 11,240,103
Files: 2,184,229 (1.8 TB)
Secret posts: 83,102
Custom fields detected: wr_1, wr_2, wr_7
Unsupported plugins: 12
Estimated conflicts: 234
```

## S6-Q03. Gnuboard 5 Importer

- 우선순위: `P1`
- 크기: `XL`

### 특히 어려운 부분

- 게시판별 write table
- 여분 필드
- 스킨/플러그인 전용 데이터
- 영카트 데이터는 초기 범위에서 제외
- 기존 패스워드 hash
- 파일 경로
- 모바일 URL
- 비밀글
- 포인트
- 회원 등급

### 비밀번호 전략

가능하면 기존 hash를 검증하고, 첫 성공 로그인에서 NUBO hash로 재해시한다. 지원할 수 없는 hash는 비밀번호 초기화 절차를 제공한다.

## S6-Q04. URL 보존

- 우선순위: `P0`
- 크기: `L`

- legacy route parser
- permanent redirect
- board ID mapping
- post ID mapping
- attachment URL
- canonical
- redirect loop 방지
- redirect hit log
- 누락 URL report

SEO를 위해 마이그레이션 성공 여부는 데이터 개수뿐 아니라 URL 도달 가능성으로 검증한다.

## S6-Q05. Rhymix/XE Analyzer와 Importer

- 우선순위: `P2`
- 크기: `XL`

- module_srl / document_srl / comment_srl
- member group
- extra vars
- attachment
- secret document
- layouts/modules는 데이터와 분리
- 서드파티 모듈 탐지
- unsupported report
- 기존 URL redirect

## S6-Q06. Starter Kits

- 우선순위: `P1`
- 크기: `L`

모든 starter kit는 별도 포크가 아니라 다음의 조합이다.

- 활성 모듈
- 기본 게시판
- 권한 preset
- 메뉴
- 홈 block
- theme token
- 샘플 데이터

### 초기 kit

- NUBO Photo Community
- NUBO Electronics Community
- NUBO Gaming Community
- NUBO Private Club

## S6 보스 조건

- [ ] TSBOARD migration이 반복 가능하고 검증 보고서를 냄
- [ ] G5 사이트를 dry-run 분석할 수 있음
- [ ] 지원하지 않는 데이터가 조용히 버려지지 않음
- [ ] 이전 URL이 301로 신규 콘텐츠에 연결됨
- [ ] 중단된 import를 재개할 수 있음
- [ ] Starter Kit로 설치 후 목적에 맞는 기본 사이트가 바로 보임

---

# 13. S7 — 레이드 규모 확장

## 원칙

실제 운영 지표 없이 Redis, Kafka, Elasticsearch, Kubernetes를 먼저 넣지 않는다.

병목이 확인되면 가장 작은 변경부터 한다.

## S7-Q01. 운영 지표

- 요청 수
- 오류율
- p95/p99
- DB connection
- slow query
- image job latency
- webhook queue
- mail queue
- upload 실패
- storage 사용량
- cache hit
- SSR render time

## S7-Q02. 작업 큐

- 우선순위: `P2`
- 크기: `XL`

대상:

- 이미지 파생본
- 대량 메일
- Webhook
- 검색 색인
- 파일 정리
- migration batch

설치 단순성을 위해 첫 구현은 DB-backed queue 또는 GOAPI 내부 worker를 검토한다. 부하가 커지면 별도 worker/Redis 모드로 분리한다.

## S7-Q03. 캐시

- 우선순위: `P2`
- 크기: `L`

- 게시판 설정
- 권한 정의
- 홈 최신글
- 공개 게시글
- 스킨 설정
- invalidation event
- cache key version
- per-user data cache 금지 또는 엄격한 scope

## S7-Q04. 검색

- 우선순위: `P2`
- 크기: `XL`

단계:

1. MySQL index/query 개선
2. MySQL FULLTEXT 가능성
3. optional external search adapter
4. Meilisearch/Typesense/OpenSearch 중 운영 요구에 맞춰 선택

검색 엔진을 코어 필수 의존성으로 만들지 않는다.

## S7-Q05. Object Storage와 CDN

- local -> S3-compatible
- public/private bucket
- signed URL
- cache purge
- lifecycle
- orphan cleanup
- regional upload
- 운영자 백업 대상과 보존 책임 문서화

## S7-Q06. 다중 인스턴스

- session/cookie 일관성
- shared storage
- cache
- distributed lock
- job ownership
- websocket/SSE
- zero-downtime deploy

단일 VPS 운영 경험을 희생하면서까지 조기에 구현하지 않는다.

---

# 14. 커뮤니티 유형별 Starter Pack

## 14.1 Photo Pack — 최우선

### Core에 가까운 기능

- 미디어 파이프라인
- 전체 화면 뷰어
- EXIF privacy
- responsive image
- 원본 다운로드 정책

### Pack 설정

- 갤러리 중심 홈
- 사진 게시판
- 장비 태그
- 작성자 포트폴리오
- 추천 사진
- 촬영 정보 노출
- 어두운 감상 화면

### 선택 모듈

- 카메라/렌즈 사전
- 사진 공모전
- 주간 테마
- 장비 중고거래

## 14.2 Electronics Pack

### Pack 설정

- 기기별 게시판
- 질문/사용기/뉴스/딜 분류
- 스펙 표
- 코드와 로그 표시
- 표와 이미지 혼합 콘텐츠
- 중고거래

### 선택 모듈

- 제품 사전
- 스펙 비교
- 가격 정보 external app
- 벤치마크 데이터
- 구매 인증
- 핫딜 만료

제품 사전은 게시판 코어에 넣지 않는다.

## 14.3 Gaming Pack

### Pack 설정

- 게임/플랫폼 태그
- 공략/질문/뉴스/모집
- spoiler block
- 패치 노트 표현
- 길드/클랜 게시판
- 음성채팅 링크

### 선택 모듈

- 일정
- 파티 모집
- 길드 roster
- 게임 사전
- 대회 bracket
- Discord integration

## 14.4 공통 UX

세 Pack 모두 다음을 공유한다.

- 정보 밀도가 높은 목록 옵션
- 모바일 하단 조작
- 읽던 위치
- 북마크
- 멘션
- 알림 설정
- 추천글
- 작성자 차단
- 신고
- 검색 filter
- 접근성

---

# 15. 빌드 없이 가능한 수정의 범위

prebuilt를 성공시키려면 “사용자가 소스를 수정해야 하는 이유”를 줄여야 한다.

## 15.1 관리자 런타임 설정으로 옮길 항목

- 사이트 title/description
- logo/favicon
- locale/timezone
- 색상 token
- font preset
- border radius/density
- light/dark mode 정책
- 메뉴
- footer
- 홈 block 순서
- 게시판 활성화
- 게시판별 skin
- 목록 밀도
- 이미지 크기/품질
- 원본 다운로드
- EXIF 공개
- 가입 정책
- 메일
- OAuth
- SEO metadata
- robots/sitemap
- 기능 flag

## 15.2 Runtime Block의 안전 경계

허용:

- 정해진 component registry
- 검증된 props
- data source ID
- 순서와 visibility
- capability condition
- theme token

금지:

- arbitrary JavaScript
- arbitrary SQL
- arbitrary server command
- 검증되지 않은 HTML
- secret 접근
- 임의 API 호출

## 15.3 개발자 커스텀 빌드가 필요한 경우

- 완전히 새로운 Vue component
- 새로운 page route
- 새로운 backend domain
- 새로운 DB table
- 새로운 storage/mail provider 코드
- 코어에 없는 복잡한 상호작용

이 경우에도 core fork보다 Layer/Module을 우선한다.

---

# 16. 아키텍처 결정 기록(ADR) 목록

권장 경로: `docs/adr/`

## 먼저 작성할 ADR

- ADR-001: Community OS 범위와 비목표
- ADR-002: Runtime customization vs build-time extension
- ADR-003: NUBO–GOAPI API versioning
- ADR-004: Module taxonomy
- ADR-005: Capability + Scope 권한
- ADR-006: Domain event + Outbox
- ADR-007: Storage abstraction
- ADR-008: Upload session
- ADR-009: Prebuilt release layout
- ADR-010: Atomic update and rollback
- ADR-011: Migration engine
- ADR-012: Background job strategy
- ADR-013: Search adapter
- ADR-014: Site Layer developer mode

## ADR 템플릿

```markdown
# ADR-XXX: 제목

- 상태: Proposed | Accepted | Superseded | Rejected
- 날짜:
- 결정자:

## 배경

## 해결해야 하는 문제

## 선택지

### 선택지 A

### 선택지 B

## 결정

## 이유

## 장점

## 단점과 비용

## 마이그레이션

## 롤백

## 후속 작업
```

---

# 17. 지금 만들지 않을 것

아래 항목은 명확한 수요와 기반 준비 전까지 `DEFERRED`로 둔다.

- [ ] 종합 쇼핑몰과 국내 PG 풀세트
- [ ] 무코드 범용 페이지 빌더
- [ ] Go runtime binary plugin
- [ ] arbitrary admin script
- [ ] 멀티테넌트 SaaS core
- [ ] Kubernetes 배포
- [ ] 마이크로서비스 분해
- [ ] 자체 CDN
- [ ] 자체 검색엔진
- [ ] 자체 이메일 전송 인프라
- [ ] 네이티브 모바일 앱
- [ ] 모든 기능에 AI 버튼 추가
- [ ] 블록체인/토큰/코인 기능
- [ ] 운영 데이터 없는 조기 최적화

중고거래는 Community OS와 맞으므로 유지한다. 다만 커머스 전체로 확장하지 않는다.

---

# 18. Codex 작업 프로토콜

## 18.1 작업 시작

1. NUBO와 GOAPI의 `AGENTS.md`를 읽는다.
2. 로컬 `PROJECT_STATUS.md`가 있으면 읽는다.
3. 이 문서에서 `READY` 상태의 퀘스트 하나를 고른다.
4. 선행 조건을 확인한다.
5. NUBO와 GOAPI 양쪽 영향 범위를 적는다.
6. 작업을 한 PR/commit에 넣을 수 있는 크기로 쪼갠다.

## 18.2 구현 전 출력

Codex는 다음을 먼저 제안한다.

```markdown
## 선택한 퀘스트
Sx-Qyy

## 이번 작업 단위
전체 퀘스트 중 이번 commit/PR이 해결하는 범위

## 변경 저장소
- nubo
- goapi

## API/DB/SSR 영향
- API:
- DB:
- SSR:
- 인증/권한:
- 배포:

## 테스트 계획

## 제외 범위
```

## 18.3 구현 중

- unrelated change를 건드리지 않는다.
- core 수정 없이 가능한지 먼저 검토한다.
- 새로운 환경 변수보다 관리자 설정을 우선 검토한다.
- DB 변경은 반복 실행 가능하게 한다.
- 보안 수정은 회귀 테스트를 남긴다.
- API 변경은 프런트와 백엔드를 함께 확인한다.
- 큰 작업은 최소한의 vertical slice부터 완성한다.

## 18.4 구현 후

- 관련 테스트
- 전체 lint/typecheck/build
- GO test/vet
- fresh install 또는 update 영향 확인
- 문서 갱신
- `PROJECT_STATUS.md` 갱신
- 제품 소유자 QA
- QA 전 main merge 금지

## 18.5 Codex 요청 프롬프트 템플릿

```text
NUBO Community OS 성장 공략집의 [QUEST_ID]를 진행한다.

현재 목표:
[한 문장]

이번 작업 범위:
[작게 쪼갠 범위]

반드시 확인:
- nubo/AGENTS.md
- goapi/AGENTS.md
- PROJECT_STATUS.md
- NUBO와 GOAPI API 계약 영향
- SSR/인증/권한/업로드 회귀
- 관련 테스트

완료 조건:
[이 문서의 완료 조건]

이번 범위 밖:
[명시적인 제외 항목]

먼저 구현 계획과 위험 요소를 비판적으로 검토하고, 동의된 범위만 구현한다.
```

---

# 19. `PROJECT_STATUS.md` 권장 템플릿

이 파일은 현재 작업 맥락만 담고 짧게 유지한다.

```markdown
# Active Goal

- Quest:
- Branch:
- Goal:

# Current Findings

- 

# Decisions

- 

# Changed Contracts

- API:
- DB:
- Env:
- UI slots:
- Manifest:

# Verification

- [ ] Relevant tests
- [ ] Full tests
- [ ] Lint/typecheck
- [ ] Build
- [ ] Manual QA

# Open Risks

- 

# Next Action

- 

# Recent Completion

- 
```

완료된 세부 기록을 계속 쌓지 않는다. 장기 기록은 이 Roadmap, CHANGELOG, ADR, Issue/PR에 남긴다.

---

# 20. 초기 실행 순서

현재 상태에서 권장하는 첫 번째 작업 묶음이다.

## Wave A — 기반

1. `S0-Q01` 현재 보안 안정화 완료
2. `S0-Q02` 프런트 테스트 하네스
3. `S0-Q04` health/readiness/version
4. `S0-Q03` API 오류·contract 규칙
5. `S0-Q05` 성능 기준

## Wave B — 운영 신뢰

6. `S1-Q01` request ID와 구조화 로그
7. `S1-Q03` 운영자 백업·복구 가이드
8. `S1-Q05` doctor
9. `S1-Q04` 원자적 업데이트/롤백 설계
10. `S1-Q06` 호환성과 릴리스 정책

## Wave C — prebuilt

11. `S2-Q01` `.output` prebuilt PoC
12. `S2-Q02` 통합 release bundle
13. `S2-Q03` `nuboctl install/status/doctor`
14. `S2-Q04` GitHub Actions release
15. `S2-Q06` Standard/Theme/Developer Mode 정리

## Wave D — Community OS

16. `S3-Q01` capability + scope
17. `S3-Q02` 감사 로그
18. `S3-Q03` 신고 workflow
19. `S3-Q04` 제재
20. `S3-Q07` 휴지통과 복구
21. `S3-Q06` 남용 방지
22. `S3-Q05` 대량 운영 도구

## Wave E — 대표 사진 경험

23. `S4-Q01` storage 계약
24. `S4-Q02` 파생 이미지
25. `S4-Q03` 업로드 세션
26. `S4-Q04` 몰입형 뷰어
27. `S4-Q05` EXIF privacy
28. `S4-Q07` 사진 탐색
29. `S4-Q08` 성능 예산

모듈 시스템은 위 작업에서 실제 extension point 요구가 드러난 후 시작한다. 추상화를 먼저 만들지 않는다.

---

# 21. 다음 작업 선택 규칙

새 작업을 시작하기 전에 다음 점수를 매긴다.

| 질문 | 점수 |
|---|---:|
| 보안·데이터 손실을 줄이는가? | +5 |
| 설치·업데이트·진단을 개선하는가? | +4 |
| 커뮤니티 운영자의 반복 업무를 줄이는가? | +4 |
| 사진 감상 경험을 크게 개선하는가? | +4 |
| 여러 사이트가 공통으로 사용할 수 있는가? | +3 |
| 자동 테스트로 고정할 수 있는가? | +2 |
| 실제 운영 중 관찰된 문제인가? | +2 |
| 단순히 경쟁 제품에 있어서 추가하려는가? | -3 |
| 새로운 상시 프로세스/인프라를 요구하는가? | -2 |
| 코어에 사이트별 예외를 넣는가? | -4 |
| 업데이트 경로가 불명확한가? | -5 |

점수가 높은 작은 작업을 먼저 한다.

---

# 22. 성공 지표

## 설치

- fresh Ubuntu에서 첫 관리자 로그인까지 한 명령 흐름
- 운영 서버에서 Nuxt build 불필요
- 실패 원인을 `nuboctl doctor`가 설명
- update 전 운영자 백업 확인과 데이터 경로 안내
- readiness 실패 시 rollback

## 안정성

- 중요한 인증/권한 버그에 회귀 테스트 존재
- 앱 릴리스 update/rollback 정기 검증
- NUBO–GOAPI 버전 불일치 감지
- 사용자 요청을 Nitro와 GOAPI 로그에서 연결

## 커뮤니티 운영

- 신고 처리 시간
- 관리자 대량 작업 성공률
- 복구 가능한 삭제 비율
- 스팸 차단 비율
- 권한 오류 보고 건수
- 운영자가 DB를 직접 수정해야 하는 횟수

## 사진 경험

- 목록 CLS
- 첫 이미지 LCP
- 업로드 실패/중복 비율
- 뷰어 이탈률
- 원본 대비 전송량
- 모바일 이미지 탐색 반응

## 생태계

- core 수정 없이 만든 공식 모듈 수
- 외부 App 수
- 서드파티 Skin/Layer 수
- 마이그레이션 완료 사이트 수
- 업그레이드 성공률

---

# 23. 최종 판단 원칙

새 아이디어가 생겼을 때 아래 순서로 판단한다.

1. Community OS의 핵심인가?
2. 사진·전자기기·게임 커뮤니티 중 둘 이상에 공통인가?
3. 코어가 소유해야 하는 데이터와 권한인가?
4. 모듈로 충분한가?
5. 외부 App으로 격리할 수 있는가?
6. 런타임 설정으로 해결할 수 있는가?
7. build-time Layer가 더 적절한가?
8. 업데이트·운영·마이그레이션 비용은 무엇인가?
9. 자동 테스트할 수 있는가?
10. 지금 하지 않아도 되는가?

마지막 질문에 “그렇다”면 보류한다.

---

# 24. 한 문장 전략

> **NUBO는 모든 사이트를 만드는 CMS가 아니라, 콘텐츠와 사람을 오래 연결하는 커뮤니티를 가장 잘 만들고 운영하는 Community OS가 된다.**

기능 수로 승부하지 않는다.

- 운영 안전성
- 사진 경험
- 설치와 업데이트
- 명확한 확장 계약
- 안전한 마이그레이션
- 모바일 사용성

이 여섯 가지를 계속 갈고 닦는다.
