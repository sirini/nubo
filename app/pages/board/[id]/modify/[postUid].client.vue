<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { useEditorProvider } from "~/providers/editor"
import { useWriteProvider } from "~/providers/write"
import { nuboEditorKey, nuboWriteKey } from "~/types/nubo-skin-keys"

definePageMeta({ middleware: "auth" as never })

const config = useRuntimeConfig()
const route = useRoute()
const edit = useEditorStore()
const boardId = route.params.id as string
edit.postUid = parseInt(route.params.postUid as string)

await edit.loadBoardConfig(boardId)

const selectedSkin = computed(() => {
  const skinName = config.public.defaultSkins.board
  return defineAsyncComponent(() => import(`../../../../skins/board/${skinName}/Modify.vue`))
})

watch(() => edit.tag, edit.searchTags)
watch(() => edit.title, edit.searchTitles)

onMounted(() => {
  edit.loadPost()
})

provide(nuboWriteKey, useWriteProvider())
provide(nuboEditorKey, useEditorProvider())
</script>
