<template>
  <div class="flex min-w-0 items-center gap-2.5">
    <Avatar class="size-8 shrink-0 border border-border/70"
      ><AvatarImage
        :src="post.writer.profile"
        :alt="recoverChars(post.writer.name)"
      /><AvatarFallback>{{ recoverChars(post.writer.name).slice(0, 2) }}</AvatarFallback></Avatar
    ><span class="truncate text-sm font-medium">{{ recoverChars(post.writer.name) }}</span>
  </div>
</template>
<script setup lang="ts">
import type { BoardListItem } from "~/types/board"
defineProps<{ post: BoardListItem }>()
</script>
