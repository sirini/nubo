# 스킨 공용 본문 에디터

NUBO의 게시글 작성·수정 본문은 플랫폼 공용 Tiptap 에디터를 사용한다. 스킨은 자체 Tiptap
확장, 도구막대, 링크·이미지 업로드 창을 복제하거나 별도 에디터를 구현하지 않는다. 이 경계를
통일하면 표와 이미지 업로드 같은 작성 기능이 모든 스킨에 동시에 반영되고, 스킨 제작자는 목록·
상세·작성 화면의 배치와 스타일에 집중할 수 있다.

스킨의 작성·수정 컴포넌트에서는 다음 공개 컴포넌트만 가져오면 된다.

```vue
<template>
  <NuboTiptapEditor v-model="content" :config="config" />
</template>

<script setup lang="ts">
import NuboTiptapEditor from "~/components/editor/NuboTiptapEditor.vue"
import { useNuboEditorContext } from "~/providers/contexts/editor"

const { config, content } = useNuboEditorContext()
</script>
```

댓글처럼 제한된 도구만 필요한 경우 `profile="comment"`를 지정한다. 게시글 기본 profile은
`post`이며 제목 단계, 글자색, 이미지, 코드 블록과 표 삽입·행/열 편집을 제공한다.

```vue
<NuboTiptapEditor v-model="content" :config="config" profile="comment" />
```

에디터 기능 변경은 `app/components/editor`와 `useTiptapEditor`에서 수행한다. 스킨별 여백이나
배치는 공용 컴포넌트를 감싸는 요소에서 조절하되, 스킨 폴더 안에 Tiptap 구현을 복사하지 않는다.
