<template>
  <CommonVTooltip content="목록 페이지로 돌아갑니다">
    <Button as-child variant="outline">
      <NuxtLink :to="`/board/${boardId}`">목록보기</NuxtLink></Button
    >
  </CommonVTooltip>
</template>

<script setup lang="ts">
defineProps<{ boardId: string }>()
</script>
