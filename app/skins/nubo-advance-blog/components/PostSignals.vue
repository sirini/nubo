<template>
  <span class="inline-flex shrink-0 items-center gap-3 text-xs text-muted-foreground"
    ><span class="inline-flex items-center gap-1"
      ><HeartIcon class="size-3.5" :class="post.liked ? 'fill-current text-primary' : ''" />{{
        num(post.like)
      }}</span
    ><span class="inline-flex items-center gap-1"
      ><MessageCircleIcon class="size-3.5" />{{ num(post.comment) }}</span
    ></span
  >
</template>
<script setup lang="ts">
import { HeartIcon, MessageCircleIcon } from "lucide-vue-next"
import type { BoardListItem } from "~/types/board"
defineProps<{ post: BoardListItem }>()
</script>
