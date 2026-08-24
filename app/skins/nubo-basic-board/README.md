# 기본 게시판 스킨 만들기

이 폴더는 표 형태의 일반 게시판만 담는다. 블로그와 갤러리는 각각
`nubo-basic-blog`, `nubo-basic-gallery`에서 시작하면 된다.

## 가장 먼저 바꿀 곳

- `DefaultList.vue`: 목록 화면의 전체 배치
- `components/list/ListHeader.vue`: 게시판 이름·설명·글쓰기 버튼
- `components/list/ListNoticeRow.vue`: 공지 행
- `components/list/ListPostRow.vue`: 일반 글 행
- `DefaultView.vue`: 글보기 화면의 전체 배치
- `DefaultWrite.vue`, `DefaultModify.vue`: 작성·수정 폼의 전체 배치
- `components/view`, `components/write`: 이 게시판 스킨이 소유하는 글보기·글쓰기 주변 UI

`DefaultList.vue`, `DefaultView.vue`, `DefaultWrite.vue`, `DefaultModify.vue`는 라우터가 찾는
엔트리다. 이름을 바꾸지 말고 내부 마크업과 import 대상을 수정한다.

## provider가 주는 값

스킨은 Pinia store나 API를 직접 호출하지 않는다. 페이지가 미리 제공한 context를
`useNubo*Context()`로 받아 화면만 그린다. 이 경계를 지키면 인증·권한·SSR 동작을 다시
구현하지 않고 디자인에 집중할 수 있다.

| provider | 자주 쓰는 값·함수 | 의미 |
| --- | --- | --- |
| `useNuboListContext` | `config` | 게시판 id, 이름, 설명, 폭, 분류와 권한 설정 |
|  | `notices`, `posts` | 차단 사용자를 제외한 공지·글 목록 |
|  | `page`, `totalPostCount` | 현재 페이지와 전체 글 수 |
|  | `isAdmin`, `isLoggedIn` | 관리 기능·글쓰기 버튼 노출 판단 |
|  | `option`, `keyword`, `searchPost()` | 검색 조건, 검색어와 검색 실행 |
|  | `setPagingUrl(page)` | 검색 상태를 보존한 페이지 URL 생성 |
| `useNuboViewContext` | `view`, `config` | 현재 글·작성자·이미지·첨부·게시판 설정 |
|  | `isWriter`, `isAdmin`, `isLoggedIn` | 수정·삭제·댓글 UI 권한 판단 |
|  | `likePost()`, `downloadFile()` | 좋아요 변경과 첨부 다운로드 |
|  | 댓글 관련 값·함수 | 댓글 작성·답글·수정·삭제 상태와 실행 |
|  | `openMovePostDialog()`, `move()` | 관리자용 게시글 이동 |
| `useNuboWriteContext` | `title`, `categories`, `categoryUid` | 제목과 분류 입력 상태 |
|  | `tags`, `tag`, 태그 함수 | 태그 추천·추가·삭제 상태와 실행 |
|  | `isNotice`, `isSecret`, `isWriting` | 글 옵션과 제출 진행 상태 |
|  | `writeNewPost()`, `modifyExistPost()` | 작성·수정 제출 |
|  | `cancelNewPost()`, `cancelEditPost()` | draft 정책을 포함한 취소 처리 |
| `useNuboEditorContext` | `content` | Tiptap HTML 본문. 쓰기 가능한 computed 값 |
|  | `isLoadDraft`, `loadDraft()` | 브라우저 임시 저장 글의 존재 여부와 복원 |
|  | 이미지 관련 값·함수 | 삽입 이미지 업로드·미리보기·삭제 |
|  | 서식 관련 값·함수 | 굵게, 기울임, 인용, 코드, undo/redo 등 |

각 context의 전체 타입은 `app/providers/contexts/`에 있다. `ComputedRef`는 읽기 전용,
`WritableComputedRef`는 `v-model`로 수정 가능한 상태다. 비동기 함수는 기존처럼 `await`해
중복 제출과 화면 전환 순서를 보존한다.

## 복사해서 시작하기

1. 폴더 전체를 `app/skins/my-board`처럼 복사한다.
2. `skin.json`의 `key`를 폴더명과 같게 바꾸고 이름·버전·제작자 정보를 수정한다.
3. 목록 행부터 바꾸고, 필요할 때만 이 스킨의 `components/view`와 `components/write`를 수정한다.
4. `npm run lint`, `npm run typecheck`, `npm run build`로 확인한다.

provider가 제공하지 않는 데이터가 필요하다면 store를 스킨에서 직접 참조하기 전에 NUBO의
provider 계약 확장을 제안한다. 그래야 같은 스킨이 SSR과 이후 NUBO 버전에서도 예측 가능하게 동작한다.

다른 스킨 폴더의 컴포넌트를 import하지 않는다. 공통처럼 보이는 화면도 이 폴더가 직접 소유해야
Market에서 독립적으로 설치·수정·버전 관리할 수 있다. 여러 스킨이 공유해도 되는 경계는 NUBO가
제공하는 provider, 타입과 `app/components`의 플랫폼 UI뿐이다.

본문은 플랫폼 공용 `NuboTiptapEditor`를 사용한다. 스킨에서 에디터를 복제하지 않으며 사용법은
`docs/SKIN_EDITOR.md`를 따른다.
