# 기본 블로그 스킨 만들기

이 폴더 하나에 블로그의 목록·글보기·글쓰기·수정 UI가 모두 들어 있다. 다른 스킨을 import하지
않으므로 폴더만 복사해도 전체 화면을 독립적으로 수정하고 Market에 게시할 수 있다.

## 파일 지도

- `BlogList.vue`: 목록 화면 엔트리와 최대 폭
- `components/list/BlogHeader.vue`: 블로그 소개, RSS·글쓰기 동작
- `components/list/BlogPostRow.vue`: 표지 이미지와 글 카드
- `BlogView.vue`: 읽기 진행률, 본문, 목차, 댓글 영역 배치
- `components/view/BlogHeader.vue`: 글 제목·작성 정보
- `components/view/BlogTableOfContent.vue`: 본문의 h1~h3 목차
- `BlogWrite.vue`, `BlogModify.vue`: 블로그가 직접 소유하는 작성·수정 엔트리
- `components/view`: 댓글·좋아요·첨부를 포함한 블로그 글보기 구성요소
- `components/write`: 에디터·이미지 업로드·태그·글 옵션 구성요소

라우터는 `BlogList`, `BlogView`, `BlogWrite`, `BlogModify`라는 이름을 찾으므로 이 네 파일명은
유지한다.

## provider 빠른 안내

`useNuboListContext()`는 `config`(게시판 설정), `posts`(차단 사용자 제외 글), `page`,
`isAdmin`, `isLoggedIn`을 제공한다. 검색 UI를 추가할 때는 `option`, `keyword`, `searchPost()`와
`setPagingUrl()`을 사용한다.

`useNuboViewContext()`는 `view`(현재 글·작성자·이미지·첨부), `config`, `isWriter`,
`isAdmin`, `isLoggedIn`을 제공한다. 이 스킨은 다음 함수도 사용한다.

- `updateReadingProgress(elementId)`: 본문 스크롤에 맞춰 지정 요소의 scale을 갱신한다.
- `clearReadingProgress()`: 화면을 떠날 때 scroll listener를 제거한다.
- `makeTableOfContents()`: `.nubo` 본문의 h1~h3에서 목차를 만든다.

댓글·좋아요 버튼은 같은 provider의 댓글 작성·수정·삭제 함수와 `likePost()`를 내부에서
사용한다. 값은 대부분 `ComputedRef`이므로 script에서는 `.value`, template에서는 이름 그대로
쓴다. 전체 계약은 `app/providers/contexts/list.ts`, `view.ts`에 있다.

## 복사해서 시작하기

1. 이 폴더를 `app/skins/my-blog`로 복사하고 `skin.json`의 `key`와 제작자 정보를 바꾼다.
2. `BlogPostRow.vue`와 `BlogView.vue`의 Tailwind class부터 바꾸면 목록과 본문 분위기를 빠르게
   확인할 수 있다.
3. 댓글·에디터까지 바꾸려면 이 폴더의 `components/view`, `components/write`를 바로 수정한다.
4. `npm run lint`, `npm run typecheck`, `npm run build`로 확인한다.

API나 store를 직접 호출하면 인증·SSR 경계를 중복 구현하게 된다. 필요한 데이터가 provider에
없다면 NUBO provider 계약을 확장하는 편이 재사용 가능한 스킨에 안전하다.

다른 스킨 폴더를 import하면 숨은 설치·버전 의존성이 생기므로 허용하지 않는다. 공유 경계는
NUBO의 provider, 타입과 `app/components`의 플랫폼 UI까지다.
