<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { nuboEditorKey } from "~/providers/contexts/editor"
import { nuboWriteKey } from "~/providers/contexts/write"
import { useEditorProvider } from "~/providers/editor"
import { useWriteProvider } from "~/providers/write"
import { BOARD_PREFIX } from "~/types/board"

definePageMeta({ middleware: "auth" as never })

const route = useRoute()
const edit = useEditorStore()
const auth = useAuthStore()
const boardId = route.params.id as string

const selectedSkin = computed(() => {
  const skinName = edit.config.skinKey || "nubo-basic-board"
  const boardType = BOARD_PREFIX[edit.config.type]
  return resolveSkinComponent(skinName, `${boardType}Write`, "DefaultWrite")
})

await edit.loadBoardConfig(boardId)

if (auth.isLoggedIn) {
  await edit.loadInsertedImages()
}

watch(() => edit.tag, edit.searchTags)
watch(() => edit.title, edit.searchTitles)
watch(
  () => edit.content,
  () => edit.saveDraft(),
  { deep: true },
)

onMounted(() => {
  if (edit.draftPost && edit.draftPost.content.length > 2) {
    edit.isLoadDraft = true
  } else {
    edit.isLoadDraft = false
  }
})

provide(nuboWriteKey, useWriteProvider())
provide(nuboEditorKey, useEditorProvider())
</script>
