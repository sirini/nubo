<template>
  <CardHeader class="px-3">
    <CardTitle class="line-clamp-1 my-2 text-2xl font-title px-1">{{
      board.view.post.title
    }}</CardTitle>
    <CardDescription class="inline-flex items-center px-1 font-code">
      <ViewStatusLine />
    </CardDescription>
  </CardHeader>
  <CardContent class="leading-7 px-4 nubo">
    <div v-html="board.view.post.content"></div>
  </CardContent>
  <CardFooter class="px-4 justify-between">
    <ViewTagBadges />
    <ViewLikeButton />
  </CardFooter>

  <div v-if="board.view.post.writer.signature.length > 0">
    <hr />
    <div class="text-secondary text-sm pt-3 px-4">
      {{ recoverChars(board.view.post.writer.signature) }}
    </div>
  </div>
</template>

<script setup lang="ts">
const board = useBoardStore()
</script>
