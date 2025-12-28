<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "~/assets/css/editor.scss"
import { useEditorProvider } from "~/providers/editor"
import { useViewProvider } from "~/providers/view"
import { useWriteProvider } from "~/providers/write"
import { nuboEditorKey, nuboViewKey, nuboWriteKey } from "~/types/nubo-skin-keys"

const config = useRuntimeConfig()
const route = useRoute()
const board = useBoardStore()
const comment = useCommentStore()
const boardId = route.params.id as string
const postUid = parseInt(route.params.postUid as string, 10)

const selectedSkin = computed(() => {
  const skinName = config.public.defaultSkins.board
  return defineAsyncComponent(() => import(`~/skins/board/${skinName}/View.vue`))
})

await board.getInitView(boardId, postUid)
await comment.getInitComments(board.view)

watch(
  () => route.params,
  async (newParams) => {
    await board.getInitView(newParams.id as string, parseInt(newParams.postUid as string, 10))
    comment.page = 1
  },
)

// 스킨에서 사용 가능한 변수/함수들 제공
provide(nuboViewKey, useViewProvider())
provide(nuboWriteKey, useWriteProvider())
provide(nuboEditorKey, useEditorProvider())
</script>
