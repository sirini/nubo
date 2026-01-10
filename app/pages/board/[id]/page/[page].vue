<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { useListProvider } from "~/providers/list"
import { BOARD_PREFIX, SEARCH, type Search } from "~/types/board"
import { nuboListKey } from "~/types/nubo-skin-keys"

const route = useRoute()
const config = useRuntimeConfig()
const board = useBoardStore()
const boardId = route.params.id as string
const page = parseInt(route.params.page as string)
board.page = page > 0 ? page : 1
board.option = SEARCH.TITLE as Search
board.keyword = ""

const selectedSkin = computed(() => {
  const skinName = config.public.skins.board
  const boardType = BOARD_PREFIX[board.list.config.type]
  return defineAsyncComponent(() =>
    import(`~/skins/board/${skinName}/${boardType}List.vue`).catch(
      () => import(`~/skins/board/${skinName}/DefaultList.vue`),
    ),
  )
})

await board.getInitList(boardId)

watch(
  () => route.params,
  async (newParams) => {
    board.page = parseInt(newParams.page as string)
    await board.getInitList(newParams.id as string)
  },
)

provide(nuboListKey, useListProvider())
</script>
