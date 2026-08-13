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

const route = useRoute()
const board = useBoardStore()
const comment = useCommentStore()

const boardId = computed(() => route.params.id as string)
const postUid = computed(() => parseInt(route.params.postUid as string, 10))

// 게시판 타입에 따른 글보기 미지원 시 기본 글보기 스킨 출력
const selectedSkin = computed(() => {
  const skinName = board.view.config.skinKey || "nubo-basic-board"
  const boardType = BOARD_PREFIX[board.view.config.type]
  return resolveSkinComponent(skinName, `${boardType}View`, "DefaultView")
})

// 조회수 업데이트가 필요한지 확인
const checkNeedUpdateHit = () => {
  if (import.meta.server) return false
  const viewed = JSON.parse(localStorage.getItem(HIT_KEY) || "[]") as number[]
  return !viewed.includes(postUid.value)
}

// 읽음 표시하기
const markedToRead = () => {
  if (import.meta.server) return false
  const viewed = JSON.parse(localStorage.getItem(HIT_KEY) || "[]") as number[]
  viewed.push(postUid.value)
  localStorage.setItem(HIT_KEY, JSON.stringify(viewed))
}

// 게시글 내용과 댓글들 가져오기
;(await board.getInitView(boardId.value, postUid.value, checkNeedUpdateHit()),
  await comment.getInitComments(board.view),
  markedToRead())

provide(nuboViewKey, useViewProvider())
provide(nuboWriteKey, useWriteProvider())
provide(nuboEditorKey, useEditorProvider())
</script>
