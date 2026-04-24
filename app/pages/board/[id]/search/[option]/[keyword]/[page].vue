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
const page = parseInt(route.params.page as string)
const options = ref<Record<string, number>>({
  title: SEARCH.TITLE,
  content: SEARCH.CONTENT,
  writer: SEARCH.WRITER,
  tag: SEARCH.TAG,
  imagedesc: SEARCH.IMAGEDESC,
})
board.page = page > 0 ? page : 1

board.option = (options.value[route.params.option as string] || SEARCH.TITLE) as Search
board.keyword = decodeURIComponent(route.params.keyword as string)

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
    board.option = (options.value[route.params.option as string] || SEARCH.TITLE) as Search
    board.keyword = decodeURIComponent(route.params.keyword as string)
    board.page = parseInt(newParams.page as string)
    await board.getInitList(newParams.id as string)
  },
)

provide(nuboListKey, useListProvider())
</script>
