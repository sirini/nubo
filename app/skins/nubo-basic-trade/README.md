# 기본 거래 스킨 만들기

이 폴더 하나에 거래 목록·상세·글쓰기·수정 UI가 모두 들어 있다. 다른 스킨을 import하지 않으며,
NUBO가 제공하는 거래 store와 게시판 provider 계약만 사용한다.

## 파일 지도

- `TradeList.vue`: 거래 카드 목록과 검색·페이지 이동
- `TradeView.vue`: 상품 이미지, 가격·상태·거래 정보와 댓글 영역
- `TradeWrite.vue`, `TradeModify.vue`: 거래 작성·수정 엔트리
- `components/TradeEditor.vue`: 공통 게시글 필드와 거래 필드의 제출 흐름
- `components/TradeFields.vue`: 가격·상품 상태·배송 방법 입력
- `components/list`, `components/view`, `components/write`: 이 거래 스킨이 직접 소유하는 게시판 UI

`useNuboListContext()`는 게시판 설정·글 목록·검색·페이지 이동을, `useNuboViewContext()`는 현재
글·권한·댓글·좋아요·첨부 동작을 제공한다. `useNuboWriteContext()`와
`useNuboEditorContext()`는 제목·본문·태그·업로드·제출 상태를 제공한다. 거래 전용 상품 상태는
`useTradeStore()`에서 읽고 검증한다.

다른 스킨 폴더를 import하면 숨은 설치·버전 의존성이 생기므로 허용하지 않는다. 여러 스킨이
공유해도 되는 경계는 NUBO의 provider, store, 타입과 `app/components`의 플랫폼 UI까지다.

거래글 본문은 플랫폼 공용 `NuboTiptapEditor`를 사용한다. 스킨에서 에디터를 복제하지 않으며
사용법은 `docs/SKIN_EDITOR.md`를 따른다.

폴더를 복사한 뒤 `skin.json`의 `key`, 이름·버전·제작자 정보를 바꾸고 `npm run lint`,
`npm run typecheck`, `npm run build`로 확인한다.
