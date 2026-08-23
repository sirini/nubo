# 기본 갤러리 스킨 만들기

이 폴더는 사진 목록과 감상 화면에 필요한 디자인만 담는다. 댓글·글쓰기·권한 처리처럼 모든
게시판이 공유하는 UI는 `../nubo-basic-board/components/`를 사용하므로, 처음에는 여섯 개의
전용 화면 컴포넌트에만 집중할 수 있다.

## 파일 지도

- `GalleryList.vue`: 반응형 masonry 목록 엔트리
- `components/list/GalleryHeader.vue`: 갤러리 소개와 글쓰기 버튼
- `components/list/GalleryPostCol.vue`: 사진 카드와 메타데이터
- `GalleryView.vue`: 큰 이미지와 오른쪽 정보 패널 배치
- `components/view/GalleryImageCarousel.vue`: 이미지 선택·이동
- `components/view/GalleryExif.vue`: 현재 이미지의 촬영 정보
- `GalleryWrite.vue`, `GalleryModify.vue`: 공통 작성 폼을 쓰는 교체 가능한 엔트리

라우터가 찾는 `GalleryList`, `GalleryView`, `GalleryWrite`, `GalleryModify` 파일명은 유지한다.

## provider 빠른 안내

`useNuboListContext()`의 `config`는 게시판 이름·설명·폭·권한을, `posts`는 차단 사용자를 제외한
사진 글을 제공한다. `page`, `isAdmin`, `isLoggedIn`으로 현재 위치와 버튼 노출을 판단한다.
검색이나 페이지 이동을 직접 구성할 때는 `option`, `keyword`, `searchPost()`,
`setPagingUrl(page)`를 사용한다.

`useNuboViewContext()`의 `view`에는 현재 글과 `images`, 작성자·댓글·첨부가 들어 있다.
`imgIdx`는 현재 보고 있는 이미지 인덱스인 `WritableComputedRef<number>`이므로 carousel에서
직접 변경할 수 있다. `config`, `isWriter`, `isAdmin`, `isLoggedIn`은 게시판 설정과 권한 UI에
사용하고, 공용 컴포넌트는 댓글 함수·`likePost()`·`downloadFile()`을 같은 provider에서 받는다.

template에서는 ref를 자동으로 풀어 쓰고, script에서 직접 읽거나 변경할 때는 `.value`를 쓴다.
전체 계약은 `app/providers/contexts/list.ts`, `view.ts`에 있다.

## 복사해서 시작하기

1. 이 폴더를 `app/skins/my-gallery`로 복사하고 `skin.json`의 `key`와 제작자 정보를 바꾼다.
2. `GalleryPostCol.vue`의 columns·카드 class와 `GalleryView.vue`의 grid부터 조정한다.
3. 공용 댓글·글쓰기 UI도 바꾸려면 필요한 파일만 `nubo-basic-board/components`에서 복사해
   자신의 경로로 import한다.
4. `npm run lint`, `npm run typecheck`, `npm run build`로 확인한다.

스킨에서 store나 API를 직접 호출하지 않고 provider 계약을 사용하면 인증·SSR 동작을 그대로
보존할 수 있다. 계약에 없는 데이터가 필요하면 NUBO provider 확장을 먼저 검토한다.
