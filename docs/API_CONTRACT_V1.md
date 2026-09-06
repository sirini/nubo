# NUBO API contract v1

기준일: 2026-09-03
기준 구현: NUBO `main`, GOAPI `5b17f51`

이 문서는 현재 구현된 v1 계약을 설명한다. 이상적인 새 API 규칙이 아니라, NUBO와 GOAPI가 실제로
호환성을 유지해야 하는 경계를 기록한다. 계약을 깨는 변경은 `/version`의 `apiContract`를 올리고 두
저장소를 함께 검증한다.

## 전송 경로

- 브라우저와 SSR은 원칙적으로 NUBO의 `/api/*`를 호출한다.
- Nitro는 같은 method와 path로 GOAPI에 전달하며, 보호된 경로에서는 access token 갱신을 중재한다.
- 브라우저에서 사용하는 GOAPI 경로에는 같은 method/path의 Nitro proxy를 둔다. NUBO 전용
  `/api/market/user`는 별도로 `/auth/load` 결과를 최소 identity로 좁혀 전달한다.
- `/health`, `/ready`, `/version`은 Nitro가 자체 응답과 GOAPI 상태를 조합한다.
- NUBO `/version`은 공식 release manifest의 NUBO·GOAPI version, commit, dirty 상태를 `build`에 공개하고
  실행 중인 버전·API contract가 manifest와 다르면 `status="degraded"`와 machine-readable `issues`를 반환한다.
- Nitro는 시작할 때 GOAPI `/version`을 2초 제한으로 한 번 확인한다. contract 불일치나 아직 준비되지 않은
  GOAPI는 비밀값 없는 구조화 경고로 남기되 Web 기동을 막지 않으며, 지속 상태는 `/ready`와 `/version`이 판단한다.
- OAuth request/callback 6개, Android Google OAuth·토큰 갱신, Android 푸시 디바이스 등록·해제, RSS,
  `/sync`, `/board/tag/recent`, `/home/nubo`는 GOAPI 직접 노출 또는 현재 UI 비사용 경로다.

## 공통 JSON 응답

일반 handler의 응답은 다음 네 필드를 항상 가진다. 최소 machine-readable 정의는
[`contracts/api-response-v1.schema.json`](contracts/api-response-v1.schema.json)이다.

```ts
type Resp<T> =
  | { success: true; error: ""; code: 0; result: T }
  | { success: false; error: string; code: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; result: null }
```

- 성공: `success=true`, `error=""`, `code=0`, `result=T | null`
- 실패: `success=false`, `error`는 비어 있지 않은 메시지, `code=1..12`, `result=null`
- 파일 다운로드, RSS, OAuth redirect, health/readiness/version과 framework 404는 이 envelope의 예외다.
- `error`는 화면 표시용 영구 식별자가 아니다. 분기는 `code`와 HTTP status를 사용한다.

### 오류 code

| code | 이름 | 현재 의미 |
|---:|---|---|
| 0 | `SUCCESS` | 성공 |
| 1 | `NOT_ADMIN` | 로그인했지만 최고 관리자 아님 |
| 2 | `INVALID_TOKEN` | 외부/OAuth 토큰이 유효하지 않음 |
| 3 | `INVALID_PARAM` | 요청 형식 또는 필드 검증 실패 |
| 4 | `FAILED_OPERATION` | 작업 실패 또는 현재 분류되지 않은 오류 |
| 5 | `DUPLICATED_VALUE` | 중복 값 또는 상태 충돌 |
| 6 | `NO_PERMISSION` | 작업 권한 없음 |
| 7 | `EXCEED_SIZE` | 업로드 제한 초과 |
| 8 | `EXPIRED` | Nitro가 refresh 실패 후 확정한 세션 만료 |
| 9 | `MAIL_NOT_CONFIGURED` | 메일 제공자 미설정 |
| 10 | `RATE_LIMITED` | 메일 등 요청 속도 제한 |
| 11 | `SIGNUP_DISABLED` | 신규 가입 비활성화 |
| 12 | `INVALID_INVITE` | 초대가 없거나 유효하지 않음 |

## HTTP status 규칙

v1은 과거 클라이언트 호환성을 위해 application 오류를 대부분 HTTP 200 + `success=false`로 전달한다.
일부 handler만 status를 바꾸는 부분 전환은 같은 code의 처리 방식을 불안정하게 하므로 하지 않는다.

| 상황 | v1 status / code | 비고 |
|---|---|---|
| 요청 성공 | `200 / 0` | 다운로드 등 비 JSON 성공은 별도 |
| 로그인 없음·access token 무효·정지 계정 | GOAPI `401` | GOAPI middleware의 body는 envelope가 아님 |
| refresh까지 실패한 브라우저 세션 | Nitro `401 / 8` | Nitro가 표준 envelope로 정규화 |
| 최고 관리자 아님 | `200 / 1` | v2 후보는 403 |
| 일반 작업 권한 없음 | `200 / 6` | v2 후보는 403 |
| 요청/필드 검증 실패 | `200 / 3` | v2 후보는 400 또는 422 |
| 중복·상태 충돌 | `200 / 5` | v2 후보는 409 |
| 업로드 제한 초과 | `200 / 7` | v2 후보는 413 |
| 속도 제한 | `200 / 10` | v2 후보는 429 |
| 일회 다운로드 token 무효 | `403`, text | binary endpoint 예외 |
| readiness 의존성 실패 | `503`, status JSON | 운영 endpoint 예외 |
| 존재하지 않는 route | `404` | framework 응답 |

HTTP 의미를 전면 정리할 때는 contract version을 올리고, GOAPI middleware와 `utils.Err`, Nitro refresh,
프런트 오류 분기를 하나의 변경 단위로 마이그레이션한다.

## GOAPI endpoint 목록

`Public`은 로그인 없이 호출 가능, `JWT`는 활성 계정, `Admin`은 활성 UID 1을 요구한다. `Direct`는
Nitro `/api` proxy가 없거나 NUBO 자체 route가 대신하는 경로다. 중괄호는 같은 method의 path suffix다.

| 영역 | 권한 | method와 path |
|---|---|---|
| 상태 | Public · Direct | `GET /health`, `/ready`, `/version` |
| 공개 설정 | Public | `GET /skin/settings` |
| 관리자 게시판 | Admin | `GET /admin/board/{load,candidates}`; `POST /admin/board/{create,modify}`; `DELETE /admin/board/remove` |
| 관리자 대시보드 | Admin | `GET /admin/dashboard/{usage,item,statistic}` |
| 관리자 그룹 | Admin | `GET /admin/group/{load,candidates,boardids,list,groupids}`; `POST /admin/group/{create,update,admin}`; `DELETE /admin/group/remove` |
| 관리자 최신글 | Admin | `GET /admin/latest/{comments,posts}`; `DELETE /admin/latest/{comment,post}` |
| 관리자 메일 | Admin | `GET /admin/mail/{deliveries,campaigns,campaign/:uid}`; `POST /admin/mail/{preview,campaign,campaign/:uid/test,campaign/:uid/prepare,campaign/:uid/send}` |
| 관리자 신고 | Admin | `GET /admin/report/reports`; `PUT /admin/report/resolve` |
| 관리자 업적 | Admin | `GET /admin/badge/{definitions,user}`; `POST /admin/badge/{definition,grant}`; `PUT /admin/badge/definition` |
| 관리자 스킨·시스템 | Admin | `PUT /admin/skin/setting`; `GET /admin/system/mail` |
| 관리자 회원 | Admin | `GET /admin/user/{list,load,invites}`; `POST /admin/user/{create,modify,invite}`; `DELETE /admin/user/{remove,invite/:uid}` |
| 인증 공개 | Public | `POST /auth/{signin,signup,reset-password,refresh,checkemail,checkname,verify,logout}`; `GET /auth/signup/status` |
| 인증 계정 | JWT | `GET /auth/load`; `PATCH /auth/update`; `DELETE /auth/account` |
| 사용자 공개 | Public | `GET /auth/user/info`; `POST /auth/user/change-password` |
| 사용자 보호 | JWT | `GET /auth/user/{report,permission}`; `POST /auth/user/{report,manage}`; `PUT /auth/user/block`; `DELETE /auth/user/block` |
| 사용자 업적 | JWT | `GET /auth/user/achievements`; `PATCH /auth/user/achievements` |
| OAuth·네이티브 인증 | Public · Direct | `GET /auth/{google,naver,kakao}/{request,callback}`; `POST /auth/android/{google,refresh}` |
| 네이티브 푸시 | JWT · Direct | `POST /push/device`; `DELETE /push/device` (Android `token` 필드에는 FCM 설치 ID(FID) 전달) |
| 게시판 공개 | Public | `GET /board/{list,view,user/latest,transfer,original,original/transfer}` |
| 게시판 보호 | JWT | `GET /board/{download,move/list,my/studio}`; `PATCH /board/like`; `POST /board/move/apply`; `DELETE /board/remove/post` |
| 최근 태그 | Public · Direct | `GET /board/tag/recent` |
| RSS | Public · Direct | `GET /rss/:id` |
| 쪽지 | JWT | `GET /chat/{list,history}`; `POST /chat/save` |
| 댓글 공개 | Public | `GET /comment/list` |
| 댓글 보호 | JWT | `PATCH /comment/{like,modify}`; `DELETE /comment/remove`; `POST /comment/{reply,write}` |
| 에디터 공개 | Public | `GET /editor/config` |
| 에디터 보호 | JWT | `GET /editor/{load/thumbnail,load/images,load/post,suggestion/title,suggestion/tag}`; `PATCH /editor/modify`; `DELETE /editor/{remove/attached,remove/image}`; `POST /editor/{upload/images,write}` |
| 홈 공개 | Public | `GET /home/{visit,latest,latest/:id,sidebar/links}` |
| 홈 버전 | Public · Direct | `GET /home/nubo` |
| 알림 | JWT | `GET /home/noti/load`; `PATCH /home/noti/checked`, `/home/noti/checked/:notiUid` |
| 거래 공개 | Public | `GET /trade/{list,view}` |
| 거래 보호 | JWT | `GET /trade/load`; `PATCH /trade/{modify,status}`; `POST /trade/write` |
| 동기화 | Secret · Direct | `GET /sync` (`SYNC_SECRET_KEY`) |

## 내 작품 스튜디오

`GET /board/my/studio`는 JWT 활성 사용자가 요청한 게시판에 직접 작성한 작품과 누적 성과를 한 번에
조회하는 additive v1 endpoint다. NUBO에서는 같은 query로 `/api/board/my/studio`를 호출한다. 사용자 UID는
JWT에서만 결정하며 query나 body의 UID는 받지 않는다.

- query: 필수 `id`; 기본값 `page=1`, `limit=20`, `sort=recent`
- 범위: `page >= 1`, `1 <= limit <= 50`; `sort`는 `recent | views | likes | comments`
- 대상: 요청한 게시판과 JWT UID가 모두 일치하는 `CONTENT_NORMAL`·`CONTENT_SECRET` 게시물. 삭제글과
  공지는 제외하며 본인 비밀글은 포함한다.
- summary: 대상 게시물 수, preview thumbnail이 연결된 첨부 이미지 수, `post.hit` 합계,
  `post_like.liked=1` 행 수, 삭제되지 않은 댓글 수를 각각 `postCount`, `photoCount`, `viewCount`,
  `likeCount`, `commentCount`로 반환한다.
- posts: `page`, `limit`, `totalCount`, `hasNext`, `items`를 반환한다. 각 item은 `uid`, `title`, 공개 preview
  thumbnail인 `cover`, epoch-milliseconds `submitted`·`modified`, `status`, `imageCount`, `hit`, `like`,
  `comment`만 포함한다. 원본과 서버 내부 경로, 사용자 개인정보와 token은 포함하지 않는다.
- 정렬: recent는 `submitted DESC`, views는 `hit DESC`, likes와 comments는 각 집계값 `DESC`이며 모두
  `post.uid DESC`를 최종 tie-breaker로 사용한다.
- 빈 계정: 모든 summary 값과 `totalCount`는 0, `hasNext=false`, `items=[]`다.
- 실패: JWT 없음·무효·정지 계정은 middleware의 HTTP 401, 잘못된 query는 `200 / code=3`, 조회 실패는
  기존 envelope의 `200 / code=4`를 사용한다.

기간별 추이, 고유 방문자, 증감률, engagement rate, follow, bookmark는 이 endpoint의 v1 계약에 포함하지
않는다. 공개 사용자 작품 목록이 필요해질 때는 UID 노출·비밀글 제외 정책을 별도 명세하되 GOAPI의 내부
사용자·게시판 범위 repository query를 재사용한다.

## 영구 업적 배지

업적은 한 번 수여되면 유지되는 additive v1 계약이다. 만료·구독·활성 상태는 이 계약에 포함하지 않고,
관리자 여부는 기존 `admin`·권한 필드로 계속 판정한다.

```ts
type UserBadge = {
  key: string
  name: string
  description: string
  iconKey: string
  earnedAt: number // epoch milliseconds
}
```

- `GET /auth/user/info`의 `badges`에는 그 사용자의 활성 업적 전체가 들어간다. 게시물 목록·상세와 댓글
  작성자의 `writer.badges`에는 서버가 `show_inline`으로 선별한 업적만 들어간다. 클라이언트는 특정 key나
  달성 규칙을 다시 판정하지 않고 서버 결과를 표시한다.
- `GET /auth/user/achievements`는 JWT 사용자의 아직 확인하지 않은 활성 업적을 오래된 순으로 최대 10개
  반환한다. `PATCH /auth/user/achievements`는 body `{ keys: string[] }`의 소유 업적을 확인 처리하며 한 번에
  1~10개 key를 받는다. 이미 확인했거나 소유하지 않은 key는 새 상태를 만들지 않는다.
- 내장 자동 업적은 `first-post`, `first-comment`, `sensta-app`이다. 첫 글·첫 댓글은 최초 schema 설치 때
  기존 이력을 한 번만 소급한다. `sensta-app`은 JWT 사용자가 Sensta Android 또는 iOS 출처 헤더와 함께
  사진이 첨부된 게시글 저장을 성공했을 때 같은 업적으로 수여한다.
- Android는 `X-Nubo-Client: sensta-android`, iOS는 `X-Nubo-Client: sensta-ios`를 보내며 두 플랫폼 모두
  `X-Nubo-App-Version`을 함께 보낼 수 있다. 플랫폼 값은 앱 출처를 기록하는 공개 표식이며 인증 정보가
  아니다. 서버는 사용자 신원을 반드시 JWT에서 얻는다.
- 관리자는 `GET /admin/badge/definitions`로 정의를, `GET /admin/badge/user?userUid=...`로 보유 업적을
  조회한다. `POST /admin/badge/definition`은 허용된 아이콘 key로 수동 업적을 만들고,
  `PUT /admin/badge/definition`은 수동 정의만 수정한다. `POST /admin/badge/grant`의 body는
  `{ userUid, badgeKey }`이며 result는 새로 수여했으면 `true`, 이미 보유했으면 `false`다.
- 내장 자동 업적 정의는 관리자 UI에서 수정할 수 없고 현재 v1에는 수여 취소 endpoint가 없다. 기존
  획득·소급분은 migration에서 확인 완료로 표시해 기능 배포 직후 과거 축하 알림이 몰리지 않게 한다.

## 요청·응답 타입의 현재 source of truth

- GOAPI request/result 구조: `goapi/pkg/models`와 각 handler의 query/form binding
- 프런트가 실제 소비하는 result 구조: `app/types`와 `app/composables`
- 공통 envelope와 code: GOAPI `pkg/models`, NUBO `app/types/common.ts`, 이 문서의 JSON Schema
- cookie 이름: `nubo-auth-token`, `nubo-refresh-token`
- contract version: GOAPI와 NUBO `/version`의 `apiContract="1"`
- build identity: NUBO `/version`의 `build.components.{nubo,goapi}`; source 실행처럼 manifest를 찾을 수 없으면
  `build=null`, `issues`에 `release_manifest_unavailable`을 포함한다.

Go 모델에는 query, JSON, multipart form이 혼재하고 기존 TypeScript 타입도 화면별 view model을 포함한다.
따라서 현재 전 모델 자동 생성은 오히려 잘못된 결합을 만들 가능성이 높다. 먼저 프런트가 실제 소비하는
endpoint의 request/result를 목록화한 뒤, 안정된 JSON 모델부터 OpenAPI 또는 생성 타입 대상으로 옮긴다.

현재 `app/composables`와 관리자 초대 화면이 명시한 `Resp<T>` 소비 지점을 GO result 구조와 대조했다.
JSON result의 필드명은 일치하며, request는 handler가 실제 읽는 JSON·query·multipart 필드를 기준으로
확인했다. 이 과정에서 성공/실패 응답의 `result` nullability를 TypeScript discriminated union으로 고치고,
게시판 생성 request에 빠진 `levelWrite`를 추가했다. 화면 상태에만 남아 있던 과거 dashboard latest 타입도
실제 분리 endpoint 구조에 맞춰 제거했다.

## 이번 대조에서 정리한 불일치

- `/admin/group/admin`: 실제 프런트 호출과 GOAPI route 사이에 빠져 있던 Nitro proxy 추가
- `/board/move/apply`: Nitro `PUT`을 GOAPI와 같은 `POST`로 정정
- `/admin/dashboard/latest`: GOAPI route와 프런트 호출부가 없는 잔존 Nitro proxy 제거

### 공개 사진가 누적 통계

- `GET /board/user/summary?id=<board id>&targetUserUid=<positive uid>`는 인증 없이 공개 집계를 반환한다.
- `result`는 `postCount`, `photoCount`, `viewCount`, `likeCount`, `commentCount` 숫자 필드다.
- 지정 게시판의 list/view 권한이 익명에게 열려 있어야 하며, 존재하지 않거나 차단된 사용자는 거부한다.
- 지정 사용자·게시판의 `CONTENT_NORMAL` 작품만 집계한다. 사진 수는 썸네일이 생성된 첨부 사진,
  좋아요는 현재 `liked=1`인 반응이다. 비공개·삭제·기타 상태 작품은 포함하지 않는다.
- 기존 `GET /board/my/studio`는 JWT 본인 기준과 비공개 작품 포함 집계를 그대로 유지한다.
- 추가 endpoint이며 기존 웹·Android 요청/응답과 DB 스키마 변경은 없다. iOS는 서버 미배포·오류 시
  숫자를 0으로 대체하지 않고 통계 미조회 상태를 표시한다.
