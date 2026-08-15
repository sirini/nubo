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
edit.postUid = parseInt(route.params.editTargetUid as string)

const selectedSkin = computed(() => {
  const skinName = edit.config.skinKey || "nubo-basic-board"
  const boardType = BOARD_PREFIX[edit.config.type]
  return resolveSkinComponent(skinName, `${boardType}Modify`, "DefaultModify")
})

await edit.loadBoardConfig(boardId)

if (auth.isLoggedIn) {
  await edit.loadPost()
  await edit.loadInsertedImages()
}

watch(() => edit.tag, edit.searchTags)
watch(() => edit.title, edit.searchTitles)
onBeforeUnmount(() => edit.resetForm())

provide(nuboWriteKey, useWriteProvider())
provide(nuboEditorKey, useEditorProvider())
</script>
