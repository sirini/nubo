<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "~/assets/css/editor.scss"
import { nuboEditorKey } from "~/providers/contexts/editor"
import { nuboViewKey } from "~/providers/contexts/view"
import { nuboWriteKey } from "~/providers/contexts/write"
import { useEditorProvider } from "~/providers/editor"
import { useViewProvider } from "~/providers/view"
import { useWriteProvider } from "~/providers/write"
import { BOARD_PREFIX } from "~/types/board"
import { HIT_KEY } from "~/types/common"

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
    import(`~/skins/${skinName}/${boardType}View.vue`).catch(
      () => import(`~/skins/${skinName}/DefaultView.vue`),
    ),
  )
})

const checkNeedUpdateHit = () => {
  if (import.meta.server) return false
  const viewed = JSON.parse(localStorage.getItem(HIT_KEY) || "[]") as number[]
  return !viewed.includes(postUid)
}

const markedToRead = () => {
  if (import.meta.server) return false
  const viewed = JSON.parse(localStorage.getItem(HIT_KEY) || "[]") as number[]
  viewed.push(postUid)
  localStorage.setItem(HIT_KEY, JSON.stringify(viewed))
}

await Promise.all([
  board.getInitView(boardId, postUid, checkNeedUpdateHit()),
  comment.getInitComments(board.view),
])

watch(
  () => route.params,
  async (newParams) => {
    comment.page = 1
    await Promise.all([
      board.getInitView(
        newParams.id as string,
        parseInt(newParams.postUid as string, 10),
        checkNeedUpdateHit(),
      ),
      comment.getInitComments(board.view),
    ])
  },
)

markedToRead()

provide(nuboViewKey, useViewProvider())
provide(nuboWriteKey, useWriteProvider())
provide(nuboEditorKey, useEditorProvider())
</script>
