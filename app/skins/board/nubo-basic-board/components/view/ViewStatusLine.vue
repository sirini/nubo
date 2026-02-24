<template>
  <HeartIcon :class="view.post.liked ? 'text-red-300 fill-current' : ''" class="w-3 h-3 mr-2" />
  {{ view.post.like }}
  <MessageCircleIcon class="w-3 h-3 ml-4 mr-2" />
  {{ num(view.post.comment) }}
  <EyeIcon class="w-3 h-3 ml-4 mr-2" />
  {{ num(view.post.hit) }}
  <span class="flex-1"></span>
  <span>{{ date(view.post.submitted) }}</span>
</template>

<script setup lang="ts">
import { EyeIcon, HeartIcon, MessageCircleIcon } from "lucide-vue-next"
import { date, num } from "~/composables/useUtils"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view } = useNuboViewContext()
</script>
