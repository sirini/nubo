# 게시글·댓글 다중 리액션 작업 기록

## 목표
- `.ai/PLAN.md`의 리액션 확장을 GOAPI와 NUBO 웹에 구현하고, `.ai/FEEDBACK.md`(2026-09-24 재검토)의 P0·P1 지적을 반영해 재검증한다.

## 시작 상태
- NUBO 웹: `main`, HEAD `c3ec7f8`, clean
- GOAPI: `main`, HEAD `4d013ee`, 작업 트리에 이전 세션의 미커밋 수정 존재(설치 경로 복구, 읽기 SQL 인자 등)

## 피드백 반영 내역 (2026-09-24)

### GOAPI (커밋 `01489ba`, push 완료)
- **P0 핸들러 계약**: `PATCH /board/reaction`, `/comment/reaction`이 JSON 본문 전체(`boardUid`/`postUid`/`commentUid`/`reaction`)를 바인딩하도록 수정. 기존엔 `reaction`만 본문에서 읽고 uid를 `FormValue`에서 읽어 웹 JSON 요청이 항상 실패했다. 0/누락 uid는 거부.
- **P0 취소(null)**: 명시적 `null`이 활성 행을 `reaction_type=0`으로 바꾸게 수정. 기존엔 현재 종류를 다시 쓰는 no-op이라 취소가 동작하지 않았다. 빈 문자열 `reaction:""`은 거부(취소로 위장하지 않음).
- **P0 알림**: `changed := affected != 0`로 수정. 기존 `affected==2`는 첫 like INSERT(affected=1)에서 알림을 누락했다. 반복 요청(affected=0)은 무변경·timestamp 유지·알림 없음. 알림 삭제 후 재생성 우회 방식 제거.
- **P1 기존 /like**: `liked:false`는 현재 종류가 like일 때만 취소. 게시글·댓글 경로 모두 쓰기 오류를 호출자까지 전달.
- **P1 권한**: 리액션 쓰기에 삭제된 글·댓글 부모 게시글, 작성자 차단, 열람 권한 없는 비밀글 검사 추가(게시판 소속 검사에 더함).
- **P0 GET 계약**: PLAN 명세대로 상위 레벨 `reactions`(종류별 DTO) + `myReaction` 플랫 형태로 변경. 목록·공지·상세·댓글 모두 적용. 미반응 사용자 `COALESCE(...,0)` 처리.
- **P1 홈·스튜디오**: `GetPostReactionSummaries`(uid 묶음 2쿼리 집계)로 홈 최신/검색과 `GET /board/my/studio` 작품 행에 종류별 요약 채움. 누적 `likeCount`/`likes` 정렬은 좋아요 전용 유지.
- **부수**: `IsLikedPost`/`IsLikedComment`를 행 존재가 아닌 `reaction_type=1` 기준으로 수정(리액션 도입 후 취소 행이 남아 의미가 어긋나던 것), `createTables`에 `createPostLikeTable` 복구·DDL 오류 전파, FK 검증에 실제 prefix 전달(`prefixForTable` 제거 유지).
- **테스트 추가**:
  - `internal/configs/reaction_install_integration_test.go`: 실제 DB에서 새 설치 2회 반복, 레거시 테이블 후퇴 → 이행 2회(중복 2+1행 정리, 최신/동률 채택, `liked=(reaction_type=1)` 불변식, 고유 키·FK 확인). `NUBO_REACTION_INSTALL_TEST_DSN` 게이트.
  - `internal/repositories/reaction_state_integration_test.go`: 0→like→(반복)→best→취소→재취소 전이, timestamp 보존, 20개 동시 요청 후 1행·유효 상태. `NUBO_REACTION_STATE_TEST_DSN` 게이트.
  - `internal/repositories/reaction_read_test.go`: 리액션 기록 없는 사용자/uid 0(비로그인)으로 목록·공지·상세·댓글 읽기 + 인자 개수·순서 고정(sqlmock).

### NUBO 웹 (커밋 `3c14164`, push 완료)
- **플랫 계약**: `BoardListItem`/`CommentResult`/`BoardStudioPostItem`를 `reactions: ReactionCounts` + `myReaction`으로 변경, 스토어·픽커 prop·스킨 8파일 갱신.
- **P1 화면 범위**: 게시판 일반/공지 목록 행, 블로그/갤러리 카드, 홈 게시판/블로그/갤러리 섹션, 홈 검색 카드, 고급 홈 피드 카드, 고급 블로그 PostSignals, 고급 프로필 스튜디오 작품 행에 `ReactionSummary` 연결.
- **P1 비로그인**: `ReactionPicker` 트리거가 비로그인 탭/Enter 시 `/auth/login?redirect=현재경로`로 이동(기존 복귀 흐름), `aria-disabled`/`aria-label` 제공. 네이티브 `disabled`는 로그인 이동 자체를 막으므로 사용하지 않기로 결정(TASK 기록).
- **P1 정규화 호환**: `normalizeReactionState`가 `reactions` 필드가 없는 구 GOAPI 응답에서 `like`/`liked`를 이관(신규 계약 존재 시 구 필드로 덮지 않음).
- **lint 4 오류**: 기본 스킨 4종 댓글 컴포넌트의 미사용 `HeartIcon` import 제거.
- **useSkins 9.9.9 폴백**: 제거하고 `0.0.0` 최소값으로 변경(버전 누락을 호환성 issues로 드러냄). nuxt 테스트 프로젝트는 이미 `runtimeConfig.public.version=1.3.2` override를 갖고 있어 테스트는 통과. 이전 세션의 "3개 실패"는 현재 재현되지 않음(36파일 122테스트 전부 통과).
- **문서**: `docs/API_CONTRACT_V1.md`에 다중 리액션 섹션(읽기/쓰기/기존 /like 호환/권한/알림/이행) 추가, endpoint 표 갱신. `Privacy.vue`·`delete-account.vue`의 '좋아요' 문구를 '좋아요·리액션'으로 정정. `docs/PROJECT_STATUS.md` Active goal 갱신.

## 검증 결과 (2026-09-24)
- GOAPI: `go build ./...` PASS, `go vet ./...` PASS, `go test ./...` PASS(전체), `gofmt -l` 기존 무관 `pkg/templates/rss_template.go`만 리포트.
- 실제 DB(MariaDB 9.7.1, 로컬 127.0.0.1:3306): `goapi_reaction_install_test`·`goapi_reaction_state_test` 전용 DB 생성 후 통합 테스트 통과 — `goapi install` 신규/기존 설치 반복 실행, 중복 정리(로그: post_like 2행·comment_like 1행 제거), 전이·동시성 검증 완료.
- 웹: `npm run lint` 0 error(기존 50 warning), `npm run typecheck` PASS, `npm test -- --run` 36파일 122테스트 PASS, `npm run build` PASS.
- 커밋·push: GOAPI `01489ba`, NUBO `3c14164` → `main` push 완료.

## 미해결/남은 항목
- **운영 배포 전부 미실시**: 공식 `./scripts/build-ubuntu22.sh` 바이너리 준비(본기는 docker buildx 없음), `nubo.git/deploy/release-sources.json`의 GOAPI 커밋 갱신(현재 367e8fb 고정), 운영 DB 백업 → 반응 쓰기 중단 → `goapi install` → 신버전 교체 순서.
- 웹 목록 화면의 모바일 폭·키보드·스크린리더·밝은/어두운 테마 수동 QA, 제품 소유자 화면 QA 미실시.
- 종류별 조회 `(post_uid,reaction_type)` 인덱스의 실제 운영 규모 `EXPLAIN` 점검은 배포 단계에서 수행(신규 설치 DDL에는 이미 포함).
- 고급 스킨 상세·댓글의 좋아요 전용 UI는 기존 로직이 like만 다루므로 동작하지만, 피드백이 요구한 "픽커 교체"는 기본 스킨까지 적용됨(고급 스킨 상세는 다음 단계 후보).
- 리액션 알림 종류 확장(best 등)은 PLAN대로 별도 제품 결정 사항으로 유보.

## 다음 행동
- 제품 소유자 재검토 요청(이 기록과 FEEDBACK.md 대조). 승인 후 릴리스 메타데이터 갱신과 운영 배포 절차 진행.
