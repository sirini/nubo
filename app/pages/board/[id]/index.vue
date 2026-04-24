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
const boardId = route.params.id as string
board.page = 1
board.option = SEARCH.TITLE as Search
board.keyword = ""

const selectedSkin = computed(() => {
  const skinName = config.public.skins.board
  const boardType = BOARD_PREFIX[board.list.config.type]
  return defineAsyncComponent(() =>
    import(`~/skins/${skinName}/${boardType}List.vue`).catch(
      () => import(`~/skins/${skinName}/DefaultList.vue`),
    ),
  )
})

await board.getInitList(boardId)

watch(
  () => route.params,
  async (newParams) => {
    board.page = parseInt((newParams?.page || "1") as string)
    await board.getInitList(newParams.id as string)
  },
)

provide(nuboListKey, useListProvider())
</script>
