<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const route = useRoute()

const config = useRuntimeConfig()
const board = useBoardStore()
const boardId = route.params.id as string
board.page = parseInt(route.params.page as string)

const selectedSkin = computed(() => {
  const skinName = config.public.defaultSkins.board
  return defineAsyncComponent(() => import(`~/skins/board/${skinName}/List.vue`))
})

await board.getInitList(boardId)
</script>
