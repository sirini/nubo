<template>
  <CommonVTooltip content="이 게시글에 좋아요를 취소합니다" v-if="board.view.post.liked">
    <Button variant="outline" class="cursor-pointer" size="lg">
      <HeartIcon class="fill-red-500" />
    </Button>
  </CommonVTooltip>

  <CommonVTooltip content="이 게시글에 좋아요를 남깁니다" v-else>
    <Button variant="outline" class="cursor-pointer" size="lg">
      <HeartIcon class="text-red-500" />
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { HeartIcon } from "lucide-vue-next"

const board = useBoardStore()
</script>
