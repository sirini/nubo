# 다중 리액션 1차 구현 리뷰

검토: 2026-09-24. 대상: NUBO `16483a1`, GOAPI `4d013ee`, `.ai/PLAN.md`.

## 판정

**완료 기준 미달. 운영 배포 중단.** 현재 GOAPI는 `install` 이행과 핵심 조회가 실패하고, 새 리액션의 취소·JSON 계약도 동작하지 않는다. 코드가 컴파일되고 기존 테스트가 통과하는 것과 실제 기능 동작은 다르다. 아래 P0을 먼저 고치고 실제 MySQL/MariaDB 통합 검증 결과를 `.ai/TASK.md`에 기록해 재검토를 요청한다.

## P0: DB 설치·기존 데이터 이행이 막힘

1. GOAPI `internal/configs/env_setup.go:733`의 `createTables`에서 `createPostLikeTable` 호출이 사라졌다. 새 설치는 `post_like`가 생성되지 않아 `verifyBaseTables` 또는 `ensureReactionSchema`에서 실패한다. 호출과 DDL 오류 전파를 복구하고 새 설치 테스트를 추가한다.
2. 같은 파일 `:352`, `:428`의 `prefixForTable`은 `nubo_post_like`를 `nubo`로, `nubo_comment_like`를 그대로 반환한다. FK 검사에 필요한 접두사는 `nubo_`다. 따라서 기존 설치에서도 `goapi install`이 잘못된 참조 테이블명을 기대하고 실패한다. 이미 인자로 받은 `prefix`를 그대로 전달한다. 접두사 있음/없음 모두 실제 DB에서 반복 실행을 검증한다.
3. 중복 제거·기존 좋아요 백필·고유 키·중간 실패 후 재실행을 검증하는 새 테스트가 없다. 비어 있는 DB와 기존 0/1·중복 행이 있는 DB를 따로 만들어 `goapi install`을 2회씩 실행하고 행 수, 마지막 상태, FK, 인덱스를 확인한다. 이행 전후 불변식 `liked = (reaction_type = 1)`도 검사한다.

## P0: 게시글·댓글 읽기 SQL 회귀

1. `internal/repositories/board_view_repo.go:319-380`의 `GetPostItem`은 SQL의 `?` 5개에 인자 4개를 넘긴다. 모든 게시글 상세 조회가 오류가 된다. 나머지 인자를 채운 뒤, 미반응 사용자의 `SELECT reaction_type`이 `NULL`인 경우도 `COALESCE(..., 0)` 등으로 처리해야 한다. 이 함수는 편집 조회에도 사용된다.
2. `internal/repositories/board_repo.go:477-610`의 `FindPosts`는 새 사용자별 리액션 조회에 필요한 인자를 빠뜨렸고, 5개 조회 컬럼을 추가했으나 `rows.Scan`에는 대상 변수를 추가하지 않았다. 정상 행도 읽지 못해 일반 목록이 비게 된다. 공지(`:346-414`)도 미반응 사용자의 `NULL`을 `uint8`로 Scan하면 행을 건너뛴다. Scan 실패를 조용히 `continue`하지 말고 오류를 반환한다.
3. `internal/repositories/comment_repo.go:234-310`의 `GetComments`도 미반응 사용자의 서브쿼리 `NULL`을 `uint8`에 Scan하면서 댓글을 건너뛴다. 실제 DB에서 게시글/공지/댓글을 **리액션 기록이 없는 사용자와 비로그인 사용자**로 읽는 테스트를 먼저 추가한다. `like`와 종류별 수치도 함께 검증한다.

## P0: 쓰기 API와 웹 데이터 계약 불일치

1. `pkg/models/reaction_model.go:56`의 `map[ReactionType]uint`는 JSON에서 `{"1":3,"2":2}`로 출력된다. 웹 `app/types/reaction.ts:25-29`는 `like`, `best` 등의 키를 읽으므로 수치가 모두 0으로 표시된다. 임시 `go run` 확인 결과: `{"reactions":{"1":3,"2":2},"myReaction":null}`. 종류명을 키로 가진 고정 DTO를 사용하고, `PLAN.md`의 상위 레벨 `reactions`/`myReaction` 계약과 GET·PATCH 응답을 일치시킨다. 현재 GET에서는 `reactions: { reactions: ..., myReaction: ... }`로 한 단계 더 중첩된다.
2. `BoardReactionParam.Reaction`과 `CommentReactionParam.Reaction`은 `string`이다. 본문 `"reaction":null`이 빈 문자열로 디코딩되고 `ParseReaction`이 거부한다. 실제 확인 결과 `null reaction=""`, `unknown reaction: ""`. 취소는 핵심 사용 흐름이므로 명시적 `null`을 구분하고 0으로 전이시키며, 누락/미지의 종류는 거부한다.

## P1: 이전 좋아요 API·알림·권한

1. `board_service.go:441-462`, `comment_service.go:44-65`의 기존 `/like` 처리에서 `liked:false`가 다른 활성 리액션까지 지운다. 계획상 좋아요일 때만 취소해야 한다. 게시글 경로는 `SetPostReaction` 오류를 `_ =`로 버리고 성공을 반환하며, 댓글 저장소도 쓰기 오류를 버린다. 실제 상태 전이와 SQL 오류가 호출자까지 전달되게 통합한다.
2. `board_view_repo.go:650-678`, `comment_repo.go:125-154`는 동일 리액션을 다시 설정해도 `timestamp`를 갱신한다. `RowsAffected()==2`이면 기존 알림을 삭제하고 서비스를 통해 다시 생성할 수 있어 읽은 알림이 새 알림이 되고 push가 반복될 수 있다. 알림 레코드 삭제로 중복 억제를 우회하지 않는다. 이전 종류를 정확히 확인해 **실제 좋아요 전환에만** 기존 알림을 보내고 반복 요청은 무변경으로 처리한다. 동시 요청에서도 한 사용자·대상에 한 행만 남기는 테스트가 필요하다.
3. `SetPostReaction`/`SetReaction`은 게시판 소속만 확인한다. 삭제 글·댓글, 비밀글 열람 권한, 차단 관계와 부모 게시글 상태가 빠져 있다. 기존 `/like`에도 같은 검사를 적용한다. 인증·잘못된 uid·다른 게시판 사례와 함께 회귀 테스트를 추가한다.

## P1: 웹 기능 범위 미달

1. `ReactionSummary.vue`가 어느 목록 화면에도 사용되지 않는다. `app/providers/home.ts`는 기존 `toggleLike`를 유지한다. 게시판 일반/공지, 블로그/갤러리 목록, 기본·고급 홈, 검색과 스튜디오 작품 행에 종류별 수치를 연결한다. `home_service.go:74-75`도 새 리액션 상태를 채우지 않아 홈 응답이 비어 있다. 상세·댓글에서는 고급 스킨이 여전히 좋아요 전용이다. `PLAN.md`의 모든 화면을 확인한다.
2. `ReactionPicker.vue:3,29-35`는 비로그인 상태에서 아무 동작도 하지 않으며 실제 HTML `disabled`도 설정하지 않는다. 기존 로그인 후 복귀 흐름으로 연결하고 모바일 탭·키보드·화면 읽기 사용성을 확인한다.
3. 웹 `normalizeReactionState`는 구 GOAPI 응답에 `reactions`가 없을 때 기존 `like`/`liked`를 이관하지 않고 0/null로 표시한다. 계획한 이행 기간 호환성을 보완한다. GOAPI 목록 조회는 종류별 상관 서브쿼리 4개를 행마다 추가했다. 계획대로 페이지의 대상 uid를 묶어 집계하는 방식으로 쿼리 수와 실행 계획을 점검한다.
4. 워커 커밋에서는 `docs/API_CONTRACT_V1.md`, `docs/PROJECT_STATUS.md`, 계정 삭제/개인정보 안내 문구가 갱신되지 않았다. 새 계약, 좋아요 통계의 의미, 현재 작업 상태를 반영한다.

## 검증·기록

- 이번 리뷰에서 GOAPI `go test ./...`, `go vet ./...`는 통과했다. NUBO `npm run typecheck`, `npm run build`, `npm test -- --reporter=dot`도 통과했고 웹 테스트는 **35개 파일, 115개 테스트 모두 통과**했다. `.ai/TASK.md`의 '3개 실패'와 '다음 행동: 커밋·푸시'는 현재 상태와 맞지 않으므로 갱신한다.
- `npm run lint`는 **4개 오류, 50개 경고로 실패**했다. 기본 스킨 네 댓글 컴포넌트의 사용하지 않는 `HeartIcon` import를 제거한다. 변경 코드용 새 단위·DB/API 통합 테스트가 두 저장소에 전혀 추가되지 않아 현재 통과한 기존 테스트가 위 문제를 잡지 못했다.
- MySQL/MariaDB 실제 설치·동시 상태 전이 검증과 제품 소유자 화면 QA는 아직 없다. 실패를 수정한 뒤 이행 전후 기록, API 예시 응답, 종류별 수치/취소/기존 모바일 좋아요, `npm run lint`·typecheck·test·build, GOAPI test·vet를 `.ai/TASK.md`에 남긴다. 임시 `useSkins` 버전 기본값 `9.9.9`는 테스트 실패를 숨길 수 있으므로 테스트 설정을 바로잡고 제거 여부를 검토한다.

## 운영 준비 상태와 재검토 조건

- 현재 Mac은 `x86_64`이지만 `docker` 명령/buildx가 없고 `nubo.git/bin/goapi` 및 GOAPI의 새 `dist/nubo-runtime/bin/goapi`도 없다. 공식 빌드 경로는 GOAPI `./scripts/build-ubuntu22.sh`이며 Docker buildx의 `linux/amd64` 빌드를 요구한다. 빌드할 때 바이너리와 `lib/`, `licenses/sharp-libvips/`를 함께 보관·전송한다. 호스트 Mac에서 직접 컴파일한 바이너리를 운영에 사용하지 않는다.
- `nubo.git/deploy/release-sources.json`의 GOAPI 커밋은 아직 `367e8fb`로 고정돼 있다. 현재 `./bin/nubo download`는 작업 커밋 `4d013ee`의 바이너리를 준비하지 않는다. 수정 완료 후 릴리스 메타데이터를 갱신하거나 공식 빌드 산출물을 별도로 staging하는 배포 경로를 명시한다.
- 현 GOAPI 코드에서 `goapi install`을 실행할 준비가 **되지 않았다**. 위 설치 결함을 고치고 격리 DB에서 새 설치·기존 설치를 검증한 다음에만 운영 백업, 반응 쓰기 중지, 새 바이너리의 `NUBO_ENV_FILE=<실제 환경 파일> ./bin/goapi install`, 스키마·수치 검증, GOAPI/웹 교체 순서로 진행한다. 설치는 `BootstrapDatabase` 전체를 호출하므로 리액션 테이블만 건드리는 명령이 아니다.
- 수정 후 모든 P0/P1과 계획의 화면 범위가 충족되고 `.ai/TASK.md`에 검증 결과·커밋·push·미배포 단계가 기록되면 재검토를 요청한다. 그 전에는 완료 선언이나 운영 업데이트를 하지 않는다.
