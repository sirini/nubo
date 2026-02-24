<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { useEditorProvider } from "~/providers/editor"
import { useWriteProvider } from "~/providers/write"
import { BOARD_PREFIX } from "~/types/board"
import { nuboEditorKey } from "~/providers/contexts/editor"
import { nuboWriteKey } from "~/providers/contexts/write"

definePageMeta({ middleware: "auth" as never })

const config = useRuntimeConfig()
const route = useRoute()
const edit = useEditorStore()
const auth = useAuthStore()
const boardId = route.params.id as string

const selectedSkin = computed(() => {
  const skinName = config.public.skins.board
  const boardType = BOARD_PREFIX[edit.config.type]
  return defineAsyncComponent(() =>
    import(`~/skins/board/${skinName}/${boardType}Write.vue`).catch(
      () => import(`~/skins/board/${skinName}/DefaultWrite.vue`),
    ),
  )
})

await edit.loadBoardConfig(boardId)

if (auth.isLoggedIn) {
  await edit.loadInsertedImages()
}

watch(() => edit.tag, edit.searchTags)
watch(() => edit.title, edit.searchTitles)

provide(nuboWriteKey, useWriteProvider())
provide(nuboEditorKey, useEditorProvider())
</script>
