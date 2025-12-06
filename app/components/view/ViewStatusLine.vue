<template>
  <HeartIcon
    :class="board.view.post.liked ? 'text-red-300 fill-current' : ''"
    class="w-3 h-3 mr-2"
  />
  {{ board.view.post.like }}
  <MessageCircleIcon class="w-3 h-3 ml-4 mr-2" />
  {{ num(board.view.post.comment) }}
  <EyeIcon class="w-3 h-3 ml-4 mr-2" />
  {{ num(board.view.post.hit) }}
  <span class="flex-1"></span>
  <span>{{ date(board.view.post.submitted) }}</span>
</template>

<script setup lang="ts">
import { EyeIcon, HeartIcon, MessageCircleIcon } from "lucide-vue-next"
import { num, date } from "~/composables/useUtils"

const board = useBoardStore()
</script>
