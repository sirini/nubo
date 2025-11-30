<template>
  <CommonVTooltip content="새로운 글을 작성합니다">
    <Button
      as-child
      variant="default"
      class="text-foreground"
      :class="{ 'opacity-50 pointer-events-none': !auth.isLoggedIn }"
    >
      <NuxtLink :to="`/board/${boardId}/write`" :aria-disabled="!auth.isLoggedIn"
        >새글작성</NuxtLink
      >
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
const auth = useAuthStore()

defineProps<{
  boardId: string
}>()
</script>
