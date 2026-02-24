<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "~/assets/css/editor.scss"
import { useEditorProvider } from "~/providers/editor"
import { useViewProvider } from "~/providers/view"
import { useWriteProvider } from "~/providers/write"
import { BOARD_PREFIX } from "~/types/board"
import { nuboEditorKey } from "~/providers/contexts/editor"
import { nuboViewKey } from "~/providers/contexts/view"
import { nuboWriteKey } from "~/providers/contexts/write"

const config = useRuntimeConfig()
const route = useRoute()
const board = useBoardStore()
const comment = useCommentStore()
const boardId = route.params.id as string
const postUid = parseInt(route.params.postUid as string, 10)

const selectedSkin = computed(() => {
  const skinName = config.public.skins.board
  const boardType = BOARD_PREFIX[board.view.config.type]
  return defineAsyncComponent(() =>
    import(`~/skins/board/${skinName}/${boardType}View.vue`).catch(
      () => import(`~/skins/board/${skinName}/DefaultView.vue`),
    ),
  )
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

provide(nuboViewKey, useViewProvider())
provide(nuboWriteKey, useWriteProvider())
provide(nuboEditorKey, useEditorProvider())
</script>
