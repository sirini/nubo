<template>
  <Card class="overflow-hidden rounded-lg shadow-lg pt-0">
    <NuxtLink :to="`/board/${post.id}/${post.uid}`">
      <img
        v-if="post.cover"
        :src="post.cover"
        alt="cover image"
        class="w-full aspect-[1/1] object-cover transition-transform hover:scale-105"
      />

      <CardHeader class="px-3">
        <CardTitle
          class="line-clamp-1 mb-2 mt-4"
          :class="post.cover ? '' : 'line-clamp-6 leading-6'"
          >{{ post.title }}</CardTitle
        >
        <CardDescription class="inline-flex items-center font-code">
          <Heart :class="post.liked ? 'text-red-200 fill-current' : ''" class="w-3 h-3 mr-2" />
          {{ post.like }}
          <MessageCircle class="w-3 h-3 ml-4 mr-2" />
          {{ showReadableNumber(post.comment) }}
          <Eye class="w-3 h-3 ml-4 mr-2" />
          {{ showReadableNumber(post.hit) }}
          <span class="flex-1"></span>
          <span class="hidden xl:inline">{{ showDateOnly(post.submitted) }}</span>
        </CardDescription>
      </CardHeader>
      <CardContent
        class="text-sm line-clamp-3 leading-6 px-3 mt-2"
        :class="post.cover ? '' : 'line-clamp-6'"
        >{{ stripHtmlTags(post.content) }}</CardContent
      >
    </NuxtLink>
  </Card>
</template>

<script setup lang="ts">
import { Eye, Heart, MessageCircle } from "lucide-vue-next"
import { showDateOnly, showReadableNumber, stripHtmlTags } from "~/lib/utils"
import type { BoardHomePostItem } from "~/types/home"
import { Card, CardContent } from "../ui/card"

const props = defineProps<{
  post: BoardHomePostItem
}>()
</script>
