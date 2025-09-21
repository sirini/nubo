<template>
  <EditorTiptapEditor v-model="content" :config="config" />
</template>

<script setup lang="ts">
import { ref } from "vue"
import type { BoardConfig } from "~/types/board"

const content = ref<string>("")
const props = defineProps<{
  config: BoardConfig
}>()
</script>
