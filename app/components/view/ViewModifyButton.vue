<template>
  <CommonVTooltip
    content="본인이 작성하신 게시글을 수정합니다"
    v-if="auth.user.uid === board.view.post.writer.uid"
  >
    <Button as-child variant="outline">
      <NuxtLink :to="`/board/${boardId}/modify/${postUid}`">수정하기</NuxtLink>
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const board = useBoardStore()

defineProps<{
  boardId: string
  postUid: number
}>()
</script>
