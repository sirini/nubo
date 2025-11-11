<template>
  <EditorTiptapEditor v-model="editor.content" :config="config" />
  <Button variant="outline" class="w-full">댓글 남기기</Button>
</template>

<script setup lang="ts">
import type { BoardConfig } from "~/types/board"

const editor = useEditorStore()
const props = defineProps<{
  config: BoardConfig
}>()
</script>
