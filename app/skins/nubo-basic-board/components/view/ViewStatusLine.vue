<template>
  <span class="font-medium text-foreground">{{ recoverChars(view.post.writer.name) }}</span>
  <span aria-hidden="true" class="mx-2">·</span>
  <time>{{ date(view.post.submitted) }}</time>
  <span class="ml-auto inline-flex items-center gap-4 pl-4">
    <span class="inline-flex items-center gap-1.5">
      <HeartIcon :class="view.post.liked ? 'fill-current text-primary' : ''" class="size-3.5" />
      {{ num(view.post.like) }}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <MessageCircleIcon class="size-3.5" /> {{ num(view.post.comment) }}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <EyeIcon class="size-3.5" /> {{ num(view.post.hit) }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { EyeIcon, HeartIcon, MessageCircleIcon } from "lucide-vue-next"
import { date, num } from "~/composables/useUtils"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view } = useNuboViewContext()
</script>
