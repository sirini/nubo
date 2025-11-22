<template>
  <EditorTiptapEditor v-model="editor.content" :config="config" />
  <Button variant="outline" class="w-full mt-3" size="lg" :disabled="!auth.isLoggedIn">{{
    auth.isLoggedIn ? "새로운 댓글을 남깁니다" : "로그인이 필요합니다"
  }}</Button>
</template>

<script setup lang="ts">
import type { BoardConfig } from "~/types/board"

const editor = useEditorStore()
const auth = useAuthStore()
const props = defineProps<{
  config: BoardConfig
}>()
</script>
