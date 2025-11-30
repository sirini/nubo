<template>
  <div>
    <Badge
      v-for="(tag, index) in board.view.tags"
      :key="index"
      variant="secondary"
      class="mt-2 mr-2"
    >
      <Hash />
      {{ tag.name }}</Badge
    >
  </div>
</template>

<script setup lang="ts">
const board = useBoardStore()
</script>
