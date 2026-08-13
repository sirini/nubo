<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { nuboListKey } from "~/providers/contexts/list"
import { useListProvider } from "~/providers/list"
import { BOARD_PREFIX, SEARCH, type Search } from "~/types/board"

const route = useRoute()
const board = useBoardStore()

const boardId = computed(() => route.params.id as string)
const page = computed(() => parseInt(route.params.page as string, 10))
const option = computed(() => route.params.option as string)
const keyword = computed(() => route.params.keyword as string)

const options: Record<string, number> = {
  title: SEARCH.TITLE,
  content: SEARCH.CONTENT,
  writer: SEARCH.WRITER,
  tag: SEARCH.TAG,
  imagedesc: SEARCH.IMAGEDESC,
}

// 게시판 타입에 따른 목록 미지원 시 기본 목록 스킨 출력
const selectedSkin = computed(() => {
  const skinName = board.list.config.skinKey || "nubo-basic-board"
  const boardType = BOARD_PREFIX[board.list.config.type]
  return resolveSkinComponent(skinName, `${boardType}List`, "DefaultList")
})

board.page = page.value > 0 ? page.value : 1
board.option = (options[option.value] || SEARCH.TITLE) as Search
board.keyword = decodeURIComponent(keyword.value)

await board.getInitList(boardId.value)

provide(nuboListKey, useListProvider())
</script>
