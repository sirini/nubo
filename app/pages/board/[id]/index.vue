<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { nuboListKey } from "~/providers/contexts/list"
import { useListProvider } from "~/providers/list"
import { BOARD_PREFIX, SEARCH, type Search } from "~/types/board"

const route = useRoute()
const config = useRuntimeConfig()
const board = useBoardStore()

const boardId = computed(() => route.params.id as string)
const page = computed(() => parseInt(route.params.page as string, 10))

// 게시판 타입에 따른 목록 미지원 시 기본 목록 스킨 출력
const selectedSkin = computed(() => {
  const skinName = config.public.skins.board
  const boardType = BOARD_PREFIX[board.list.config.type]
  return defineAsyncComponent(() =>
    import(`~/skins/${skinName}/${boardType}List.vue`).catch(
      () => import(`~/skins/${skinName}/DefaultList.vue`),
    ),
  )
})

// 하이드레이션 미스매치 방지 및 캐싱
const { data: initData } = await useAsyncData(
  `list-${boardId.value}-${page.value}`,
  async () => {
    board.page = page.value > 0 ? page.value : 1
    board.option = SEARCH.TITLE as Search
    board.keyword = ""

    await board.getInitList(boardId.value)
    return { success: true, timestamp: Date.now() }
  },
  {
    watch: [() => route.params],
  },
)

provide(nuboListKey, useListProvider())
</script>
