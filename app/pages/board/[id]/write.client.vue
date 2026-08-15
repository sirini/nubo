<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { nuboEditorKey } from "~/providers/contexts/editor"
import { nuboWriteKey } from "~/providers/contexts/write"
import { useEditorProvider } from "~/providers/editor"
import { useWriteProvider } from "~/providers/write"
import { BOARD, BOARD_PREFIX } from "~/types/board"

definePageMeta({ middleware: "auth" as never })

const route = useRoute()
const edit = useEditorStore()
const trade = useTradeStore()
const auth = useAuthStore()
const boardId = route.params.id as string

edit.cancelDraftSave()
edit.resetForm()
trade.resetForm()

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
  [
    () => edit.title,
    () => edit.content,
    () => edit.tags,
    () => edit.isSecret,
    () => edit.isNotice,
    () => edit.categoryUid,
    () => edit.config.type === BOARD.TRADE ? { ...trade.form } : null,
  ],
  () => edit.saveDraft(),
  { deep: true },
)

onMounted(() => window.addEventListener("pagehide", edit.flushDraft))
onBeforeUnmount(() => edit.preserveDraftAndReset())
onUnmounted(() => window.removeEventListener("pagehide", edit.flushDraft))

provide(nuboWriteKey, useWriteProvider())
provide(nuboEditorKey, useEditorProvider())
</script>
