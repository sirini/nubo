<template>TODO: comment list will be placed here</template>

<script setup lang="ts">
import type { BoardViewResult } from "~/types/board"

const props = defineProps<{
  view: BoardViewResult
}>()
const comment = useCommentStore()

await comment.getInitComments(1, props.view)
</script>
