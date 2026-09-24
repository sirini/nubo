<template>
  <span class="inline-flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
    <span class="inline-flex items-center gap-1">
      <MessageCircleIcon class="size-3.5" />{{ num(post.comment) }}
    </span>
    <ReactionSummary :state="{ reactions: post.reactions, myReaction: post.myReaction }" />
  </span>
</template>
<script setup lang="ts">
import { MessageCircleIcon } from "lucide-vue-next"
import type { BoardListItem } from "~/types/board"
defineProps<{ post: BoardListItem }>()
</script>
