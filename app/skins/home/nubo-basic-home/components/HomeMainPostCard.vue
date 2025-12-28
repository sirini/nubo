<template>
  <Card class="overflow-hidden rounded-lg shadow-lg pt-0">
    <NuxtLink :to="`/board/${post.id}/view/${post.uid}`">
      <img
        v-if="post.cover"
        :src="post.cover"
        alt="cover image"
        class="w-full aspect-square object-cover transition-transform hover:scale-105"
      />

      <CardHeader class="px-3">
        <CardTitle
          class="line-clamp-1 mb-2 mt-4"
          :class="post.cover ? '' : 'line-clamp-6 leading-6'"
          >{{ post.title }}</CardTitle
        >
        <CardDescription class="inline-flex items-center font-code">
          <HeartIcon :class="post.liked ? 'text-red-200 fill-current' : ''" class="w-3 h-3 mr-2" />
          {{ post.like }}
          <MessageCircleIcon class="w-3 h-3 ml-4 mr-2" />
          {{ num(post.comment) }}
          <EyeIcon class="w-3 h-3 ml-4 mr-2" />
          {{ num(post.hit) }}
          <span class="flex-1"></span>
          <span class="hidden xl:inline">{{ date(post.submitted) }}</span>
        </CardDescription>
      </CardHeader>
      <CardContent
        class="text-sm line-clamp-3 leading-6 px-3 mt-2"
        :class="post.cover ? '' : 'line-clamp-6'"
        >{{ stripTags(post.content) }}</CardContent
      >
    </NuxtLink>
  </Card>
</template>

<script setup lang="ts">
import { EyeIcon, HeartIcon, MessageCircleIcon } from "lucide-vue-next"
import { date, num, stripTags } from "~/composables/useUtils"
import type { HomePostItem } from "~/types/home"

defineProps<{ post: HomePostItem }>()
</script>
