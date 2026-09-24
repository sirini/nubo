# 게시글·댓글 리액션 확장 실행 계획

작성: 2026-09-24. 작업 저장소: 이 폴더의 NUBO 웹과 형제 저장소 `/Users/sirini/github/goapi.git`.
이 문서는 구현 지시와 검수 기준이다. 구현 에이전트는 두 저장소의 현재 코드를 다시 확인하고 변경 사항을 `.ai/TASK.md`에 기록한다.

## 목표와 1차 범위

- 게시글과 댓글에 글 작성보다 간단한 반응 수단을 제공한다. 사용자 한 명은 대상 하나에 활성 리액션을 최대 하나 남긴다. 같은 종류를 다시 누르면 취소하고 다른 종류를 누르면 교체한다.
- 기본 종류는 `like`(좋아요, ❤️), `best`(최고, 🙌), `facepalm`(아차, 🤦), `hmm`(글쎄요, 🤔) 네 가지다. 코드와 API의 식별자는 고정하고 표시 이름·아이콘은 한 곳에서 관리한다. 이 아이콘은 첫 구현 제안이며 제품 소유자 QA에서 조정할 수 있다. 이모지를 쓸 경우 OS별 모양 차이, 한국어 접근성 이름, 밝은/어두운 배경 대비를 확인한다.
- 게시글 목록에는 댓글 수와 별도로 실제 받은 리액션을 종류별 아이콘·숫자로 표시한다. 좁은 화면에서는 양수인 상위 2~3종과 `+1종` 같은 간결한 요약을 써도 되지만, 좋아요 하나만 보이는 상태로 끝내지 않는다. 상세와 선택기에는 네 종류의 수치를 모두 볼 수 있게 한다. 댓글에도 종류별 수치와 현재 사용자의 선택을 보여준다.
- 점수, 투표 순위, 댓글 정렬, 관리자별 종류 설정, 새 알림 유형, 모바일 UI 개편은 이번 범위에 넣지 않는다. `hmm`을 downvote나 제재 신호로 쓰지 않는다.

## 확인한 현행 구조와 설계 판단

| 영역 | 현재 코드와 의미 | 필요한 조치 |
| --- | --- | --- |
| 저장 | GOAPI `internal/configs/env_setup.go`의 `post_like`, `comment_like`는 `liked` 0/1과 `timestamp`를 저장한다. `(대상 uid, user_uid)` 고유 제약이 없고 쓰기 전에 존재 여부를 따로 조회한다. | 현재 테이블을 확장한다. 중복을 정리하고 고유 제약을 건 뒤 원자적으로 상태를 변경한다. |
| 읽기 | `pkg/models/board_model.go`, `comment_model.go`; `board_repo.go`, `board_view_repo.go`, `comment_repo.go`, `home_service.go`는 `like`, `liked`만 돌려준다. | 같은 응답에 종류별 집계와 내 선택을 추가한다. 목록 단위로 집계해 쿼리 증가를 제한한다. |
| 쓰기 | JWT가 필요한 `PATCH /board/like`, `/comment/like`; `board_service.go`, `comment_service.go`가 bool을 처리한다. | 새 `/board/reaction`, `/comment/reaction`을 제공하고 기존 경로는 공통 상태 변경 로직에 매핑한다. |
| 부수 효과 | `liked=1`은 홈·목록·관리자·스튜디오 좋아요 수, 모바일 앱, 기존 알림/푸시에 쓰인다. | `like`/`liked`/`likeCount`/`likes` 정렬은 계속 **좋아요만** 뜻하게 한다. 비슷한 이름의 통계를 전체 리액션으로 조용히 바꾸지 않는다. |
| 웹 화면 | `app/stores/{board,comment}.ts`, `app/providers/{view,home}.ts`, 기본·고급 스킨에 좋아요 UI가 흩어져 있다. | 공유 리액션 메타데이터와 조작 컴포넌트를 만들고 각 스킨의 목록·상세·댓글·홈 표시를 연결한다. |

새 테이블 하나로 게시글과 댓글을 합치는 것보다 현재 테이블 두 개를 유지하는 편이 FK, 게시판 이동, 게시물·회원 삭제 흐름을 보존하기 쉽다. `liked`를 0~4 코드로 재해석하면 기존 컬럼명과 bool 계약이 서로 어긋난다. 따라서 `reaction_type`을 단일 원본으로 추가하고 `liked`는 기존 클라이언트를 위한 좋아요 전용 투영값으로 유지한다. 쓰기에서는 두 컬럼을 항상 한 SQL 변경/트랜잭션 안에서 동기화한다.

## 저장 스키마와 이행

1. 두 테이블 각각에 `reaction_type TINYINT UNSIGNED NOT NULL DEFAULT 0`을 추가한다. DB 코드: `0` 없음, `1` like, `2` best, `3` facepalm, `4` hmm. 기존 `liked=1`은 `reaction_type=1`, `liked=0`은 `reaction_type=0`으로 이전한다. 새 상태에서는 `liked = (reaction_type = 1)` 불변식을 지킨다.
2. 중복 행을 안전하게 구별할 수 있도록 두 테이블에 `uid BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`를 추가한다. 기존 테이블에는 PK가 없다. `(post_uid,user_uid)` 및 `(comment_uid,user_uid)`별로 가장 큰 `timestamp`, 동률이면 가장 큰 새 `uid` 한 행만 남긴다. 마지막 행이 취소(`liked=0`)이면 취소 상태를 보존한다. 중복 수와 정리 결과를 설치 로그/작업 기록에 남긴다. 대상·게시판 FK와 이동 후 `board_uid`도 확인한다.
3. 중복 제거 후 각각 `UNIQUE (post_uid,user_uid)`, `UNIQUE (comment_uid,user_uid)`를 추가한다. 종류별 조회에 맞는 `(post_uid,reaction_type)` 및 `(comment_uid,reaction_type)` 인덱스는 실제 집계 SQL의 `EXPLAIN`으로 필요성을 확인해 추가한다. 기존 사용자 삭제 인덱스는 유지한다.
4. `createPostLikeTable`/`createCommentLikeTable`의 새 설치 DDL과 `InstallSchema`의 기존 설치 이행 경로를 모두 고친다. `information_schema`로 컬럼·키 존재를 확인하고 재실행해도 기존 2~4 코드가 1로 덮이지 않게 한다. DDL/백필/중복 정리 중간에 실패한 뒤 `goapi install`을 다시 실행해 완료할 수 있어야 한다. 기존 GOAPI는 새 컬럼을 채우지 못하므로 이행 중 반응 쓰기를 잠시 멈추고, 신버전 전환 직전에 `liked=1 AND reaction_type=0` 잔여 행이 없는지 확인/재동기화한다. 구·신 GOAPI가 같은 DB에 동시에 반응을 쓰는 기간을 두지 않는다.
5. DDL은 큰 테이블에서 락/재구축이 생길 수 있다. 구현 시 실제 행 수와 DB 버전을 확인해 소요 시간·배포 순서를 `.ai/TASK.md`에 기록하고 백업 후 이행한다. 운영 DB에 직접 적용하는 작업은 별도 배포 단계로 남긴다.

## API 계약

- 공개 읽기 응답의 게시글 객체(`GET /board/list`의 일반/공지, `/board/view`, 홈 최신/검색), `GET /board/my/studio`의 작품 항목 및 `GET /comment/list`의 댓글 객체에 다음 필드를 추가한다. `reactions`의 네 값은 0이어도 항상 존재한다. 비로그인 사용자의 `myReaction`은 `null`이다.

```json
{
  "like": 3,
  "liked": false,
  "reactions": { "like": 3, "best": 2, "facepalm": 0, "hmm": 1 },
  "myReaction": "best"
}
```

- 새 JWT 쓰기: `PATCH /board/reaction`에 `{ "boardUid": 1, "postUid": 2, "reaction": "best" }`, `PATCH /comment/reaction`에 `{ "boardUid": 1, "commentUid": 3, "reaction": null }`을 보낸다. `reaction`은 위 네 문자열이나 명시적 `null`만 허용한다. 빠진 필드, 미지의 종류, 0/비정상 uid는 거부한다. `userUid`는 본문을 믿지 않고 JWT에서만 얻는다.
- 성공 응답의 `result`는 해당 대상의 최신 `{ "reactions": {...}, "myReaction": "best" }`이다. 같은 상태를 다시 설정하면 성공하되 DB 상태와 알림은 바뀌지 않는다. 전환은 이전 종류를 내리고 새 종류를 올리며 합계 한 표만 유지한다. 취소(`null`)는 활성 행을 0으로 바꾸며 행을 새로 만들 필요가 없다.
- 기존 `PATCH /board/like`, `/comment/like`의 요청 `{liked:boolean}`와 응답 형식은 유지한다. `liked:true`는 `reaction=like` 설정이다. `liked:false`는 현재 종류가 `like`일 때만 취소하고 다른 종류라면 건드리지 않는다. 기존 GET의 `like`는 `reactions.like`, `liked`는 `myReaction === "like"`다. 이는 iOS/Android의 기존 좋아요 흐름과 스튜디오·관리자 통계를 보호한다.
- 게시판 소속, 삭제된 대상, 비밀글 열람 권한, 사용자 차단/상호 차단을 새 경로와 기존 좋아요 경로에서 함께 검증한다. 댓글은 부모 게시글 상태와 접근 권한도 검사한다. 공개 읽기의 집계는 기존 목록/상세 접근 정책을 따른다. 실패한 SQL을 성공으로 반환하지 않는다.
- 좋아요 알림/푸시는 실제 `like`로 **상태가 바뀐 경우**에만 기존 유형과 문구로 보낸다. 다른 리액션을 같은 '좋아요' 알림으로 표시하지 않는다. 기존 중복 억제와 자기 글/댓글 제외를 유지한다. 새 리액션 알림은 별도 제품 결정 후 확장한다.

## GOAPI 구현 순서

1. `pkg/models`에 종류 코드, 문자열 변환/검증, 요약 DTO를 공통 정의한다. `internal/configs/env_setup.go`와 관련 이행 테스트를 먼저 작성한다. 실제 MySQL/MariaDB로 0/1 백필, 중복, 동률, 재실행, 고유 키를 확인한다.
2. 게시글·댓글 서비스가 같은 전이 규칙을 사용하게 한다. 저장소는 고유 키와 트랜잭션/원자적 upsert를 사용하고 실제 이전 상태를 확인해 알림을 결정한다. 별도 조회→INSERT/UPDATE만으로 경쟁 요청을 처리하는 현행 패턴과 오류를 무시하는 `Exec`를 그대로 복제하지 않는다. 같은 사용자/대상 동시 요청에서 행 하나와 유효한 최종 상태가 보장되어야 한다.
3. GET 응답을 확장한다. 게시판 일반/공지 목록, 상세, 홈 최신/검색, 댓글 페이지의 **대상 uid 묶음**에 대해 종류별 집계와 내 선택을 불러와 DTO에 합친다. 각 카드·종류마다 상관 서브쿼리/N+1을 추가하지 않는다. 게시글 상세의 `post`, 댓글의 답글, 검색·공지에도 빠짐없이 채운다. `GET /board/my/studio` 작품 목록처럼 게시글 카드에 좋아요와 댓글 수를 함께 표시하는 화면도 점검해 같은 요약을 제공한다. 해당 화면의 누적 `likeCount`와 `likes` 정렬은 좋아요 전용이다.
4. `internal/routers`, `handlers`, 기존 `like` 서비스, `notification_publisher.go` 영향 범위를 연결한다. 계정/게시판/게시글 삭제와 게시판 이동이 확장된 행을 그대로 다루는지 검증한다. `board_studio_repo.go`, `admin_repo.go` 등의 좋아요 전용 통계는 의미와 값이 유지되는지 확인한다.
5. API 문서(`NUBO/docs/API_CONTRACT_V1.md` 또는 해당 계약 문서)에 새 필드/경로, 기존 좋아요 호환성, 코드 매핑과 배포 순서를 반영한다.

## NUBO 웹 구현 순서

1. `app/types/{board,comment,home}.ts`와 기본값, `app/composables/{useBoard,useComment}.ts`, Nuxt 서버 프록시 `server/api/{board,comment}/reaction.patch.ts`를 갱신한다. 기본값은 0 네 개와 `myReaction:null`이다. 서버가 이전 버전일 때 읽기 필드가 없는 경우도 앱이 깨지지 않게 정규화하고, 쓰기 배포는 신 GOAPI가 준비된 뒤 진행한다.
2. 공용 반응 정의/요약/선택 UI를 만든다. 아이콘과 한글 이름을 한 곳에서 관리하고, 마우스 hover만으로 기능을 숨기지 않는다. 모바일 탭·키보드·스크린리더에서 열고 고를 수 있어야 한다. 선택기에는 네 종류가 모두 보이고 선택됨(`aria-pressed` 등), 종류와 개수, 취소 방법이 읽혀야 한다. 비로그인 탭은 기존 로그인/복귀 흐름으로 연결한다.
3. `app/stores/{board,comment}.ts`, `app/providers/{view,home}.ts` 및 context 타입을 새 상태 변경으로 옮긴다. 대상별 중복 요청을 막고 성공 시 서버가 돌려준 요약으로 갱신한다. 실패하면 표시 상태를 되돌리거나 재조회한다. 홈 카드·상세 사이를 이동한 뒤에도 모순이 오래 남지 않게 재조회 경로를 확인한다.
4. 기본 스킨 `nubo-basic-board/blog/gallery/trade`와 고급 스킨 `nubo-advance-blog/gallery/home`의 게시글 상세·댓글에서 좋아요 단일 버튼을 교체한다. 게시판 일반/공지 목록, 갤러리/블로그 목록, 기본/고급 홈의 카드·검색 결과에는 댓글 수 옆에 받은 리액션 요약을 표시한다. `app/skins/nubo-basic-home`의 섹션, `nubo-advance-blog/components/PostSignals.vue`, `nubo-advance-profile/components/AdvanceProfileStudio.vue`의 작품 행도 확인한다. 반복 마크업을 복사해 놓지 말고 공용 컴포넌트를 활용하되 각 스킨의 배치와 간격은 유지한다.
5. 작은 화면에서 제목·댓글 수·리액션이 서로 밀지 않도록 확인한다. 색상만으로 선택을 구분하지 않고, 텍스트/접근성 이름에 종류를 포함한다. SSR와 클라이언트 첫 표시가 일치해야 한다. 계정 삭제·개인정보 안내의 '좋아요' 데이터 설명도 리액션 보존/삭제 의미에 맞게 갱신한다.

## 검증과 완료 기준

- GOAPI: 새 설치·기존 설치 이행을 MySQL/MariaDB 중 사용 가능한 실제 DB에서 검증한다. `liked=1/0` 이전, 최신 중복 행 채택, 0→종류→다른 종류→0, 같은 요청 반복·동시 요청, 미지의 종류/잘못된 uid, 비로그인·다른 게시판·삭제·비밀·차단 사례를 테스트한다. 이전 `/like` API와 좋아요 알림, 관리자·스튜디오 좋아요 수/정렬도 회귀 검증한다. 변경 Go 파일 `gofmt`, 관련 테스트, `go test ./...`, `go vet ./...`를 수행한다.
- 웹: 공유 상태 전이와 응답 정규화의 의미 있는 단위 테스트 및 핵심 화면 상호작용을 확인한다. `npm run lint`, `npm run typecheck`, 관련 `npm test`, `npm run build`를 실행한다. 일반/공지/검색/홈/상세/댓글, 비로그인, 모바일 폭, 키보드, 밝은·어두운 테마에서 수치와 선택 상태를 확인한다.
- API 예시 수치에서 `like === reactions.like`이고, 같은 사용자는 한 대상에 최대 한 종류만 집계된다. 웹에서 전환·취소 후 목록/상세 새로고침 값이 일치한다. iOS/Android의 기존 좋아요 요청·읽기 필드는 그대로 동작한다.
- GOAPI 운영용 Linux 바이너리가 필요하면 반드시 형제 저장소의 `./scripts/build-ubuntu22.sh`로만 빌드한다. 운영 이행은 DB 백업 → 반응 쓰기 중단 → `goapi install`/최종 백필·검증 → 신 GOAPI → 신 웹 → 쓰기 재개 순서로 준비한다. 코드 작업과 운영 배포를 구분해 결과를 기록한다.

## 구현 에이전트 기록과 인계

- **작업 시작 즉시** 이 폴더에 `.ai/TASK.md`를 만든다. 목표, 시작 시 두 저장소의 브랜치/HEAD/dirty 상태, 결정·변경 파일, DB 이행 전후 점검, 통과/실패한 명령, 남은 문제, 다음 행동을 적는다. 각 단계가 끝날 때 최신 상태로 갱신하고, 계획에서 달라진 결정과 이유를 기록한다.
- 두 저장소의 `AGENTS.md`와 `docs/PROJECT_STATUS.md`를 읽고 상태 문서를 의미 있는 단계에서 갱신한다. 다른 사용자 변경은 보존한다. 각각의 검증된 작업 단위를 `main`에 집중된 커밋으로 남기고 지침에 따라 push한다.
- 마지막에는 `.ai/TASK.md`에 커밋 해시, push 결과, 미배포 DB/API/웹 단계, 수행하지 못한 검증과 제품 소유자 QA 항목을 명시한다. 이후 검토 에이전트가 `PLAN.md`의 계약/완료 기준과 `TASK.md`의 실제 결과를 비교할 수 있어야 한다.
