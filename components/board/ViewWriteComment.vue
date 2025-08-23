<template>
  <EditorTiptapEditor v-model="content" />
</template>

<script setup lang="ts">
import { ref } from "vue"

const content = ref<string>("")
</script>
