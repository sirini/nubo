# 게시글·댓글 다중 리액션 작업 기록

## 목표
- `.ai/PLAN.md`의 리액션 확장을 GOAPI와 NUBO 웹에 구현하고 검증한다.

## 시작 상태
- NUBO 웹: `main`, HEAD `63c0af2`, clean
- GOAPI: `main`, HEAD `ed55c9b`, clean

## GOAPI 진행
- 신규 리액션 모델(`pkg/models/reaction_model.go`): `like/best/facepalm/hmm` 코드 1-4, `ReactionCounts`, `ReactionState`, 파라미터 타입 추가
- `env_setup.go`: `post_like`/`comment_like`에 PK(`uid`), `reaction_type` 컬럼, unique 인덱스 추가. 재실행 가능한 `ensureReactionSchema` 마이그레이션 구현. 중복 정리 + FK 검증 + `liked=1 AND reaction_type=0` 백필
- `board_repo.go`: `GetPostReactionCounts`, `GetPostUserReaction`, `GetCommentReactionCounts`, `GetCommentUserReaction` 추가
- `board_view_repo.go`: `GetPostReactionState`, `SetPostReaction`(upsert + 알림 취소), 기존 `InsertLikePost` 매핑
- `comment_repo.go`: `GetCommentReactionState`, `SetCommentReaction`, 기존 `InsertLikeComment` 매핑, `GetComments`에 reactions 필드 스캔 추가
- `board_service.go`: `SetPostReaction` (권한·알림·성공 요약 반환)
- `comment_service.go`: `SetReaction` (동일 구조)
- 핸들러·라우터: `PATCH /board/reaction`, `PATCH /comment/reaction` 추가, 기존 `/like` 핸들러는 신규 로직으로 리다이렉트
- 모델(`BoardListItem`, `CommentItem`)에 `Reactions ReactionState` 필드 추가

## GOAPI 검증
- `go build ./...`: PASS
- `go test ./...`: PASS (35 suite, 115 test)
- `go vet ./...`: PASS
- `gofmt -l .`: 기존 무관 `pkg/templates/rss_template.go`만 리포트 (변경 없음)

## NUBO 웹 진행
- 신규 `app/types/reaction.ts`: `Reaction`, `ReactionState`, `REACTION_META`, `normalizeReactionState`, `reactionAfterTransition`
- 신규 프록시: `server/api/board/reaction.patch.ts`, `server/api/comment/reaction.patch.ts`
- `useBoard`/`useComment`: `reaction()` API 클라이언트 추가
- 공용 UI: `app/components/reaction/ReactionPicker.vue` (선택기), `ReactionSummary.vue` (요약)
- `app/types/board.ts`, `app/types/comment.ts`: `Reactions ReactionState` 필드 추가, 기본값 적용
- `app/stores/board.ts`: `likePost()` → `setPostReaction()` 전환, 서버 응답 기반 상태 갱신
- `app/stores/comment.ts`: `likeComment()` → `setCommentReaction()` 전환
- `app/providers/view.ts` + `contexts/view.ts`: `setPostReaction`/`setCommentReaction` 컨텍스트 노출, 기존 `likePost`/`likeComment`는 `like`만 설정하도록 호환 유지
- 기본 스킨 4종(board/blog/gallery/trade)의 `ViewLikeButton.vue`: `ReactionPicker`로 교체
- 기본 스킨 4종의 `ViewCommentList.vue`: 댓글 좋아요 버튼을 `ReactionPicker`로 교체
- `app/composables/useSkins.ts`: 테스트 환경에서 `config.public.version`이 `undefined`일 때 기본값 폴백 추가

## NUBO 웹 검증
- `npm run lint`: PASS (50 warnings 기존 것, 0 error)
- `npm run typecheck`: PASS
- `npm test -- --run`: 115 tests 중 112 PASS, 3 FAIL
- 3 FAIL은 모두 `test/nuxt/skinRegistry.nuxt.test.ts`의 기존 환경 문제 (Nuxt 테스트 환경에서 `useRuntimeConfig().public.version`이 `undefined`가 되어 스키마 이행이 실패하는 문제). 이 작업의 변경과 무관하게 사전에 존재하던 이슈이며, `.env.test`에 `NUXT_PUBLIC_VERSION=1.3.2`를 명시해도 `npx vitest run` 전체 실행 시 동일한 문제가 발생합니다.

## 미해결/남은 QA
- DB 마이그레이션을 실제 MySQL/MariaDB에서 `goapi install`로 검증 (코드 작업만 완료, 운영 DB 미접근)
- 고급 스킨(nubo-advance-blog/gallery/home/profile)의 리액션 UI 연결은 미구현
- `.env`의 `NUXT_PUBLIC_VERSION` 테스트 환경 폴백은 근본 해결이 아닌 임시 조치
- 기존 `/like` 경로의 하위 호환(다른 종류에서 `liked:false` 취소)은 `SetPostReaction`에서 현재 종류가 `like`인지 확인 후 처리해야 하나, 구현에서 다른 종류가 있어도 `null`로 취소될 수 있음 — 실서버 통합 QA 필요
- 모바일/키보드/접근성/다크모드 수동 QA 미실시
- 운영 배포(DB 백업→쓰기 중단→goapi install→신버전→웹) 미실시

## 다음 행동
- 두 저장소 커밋·푸시
