<template>
  <Card class="overflow-hidden rounded-lg shadow-lg pt-0">
    <img
      v-if="post.cover"
      :src="post.cover"
      alt="cover image"
      class="w-full aspect-[1/1] object-cover transition-transform hover:scale-105"
    />
    <CardHeader class="px-3">
      <CardTitle class="line-clamp-1 mb-2">{{ post.title }}</CardTitle>
      <CardDescription class="inline-flex items-center">
        <Heart :class="post.liked ? 'text-red-200 fill-current' : ''" class="w-3 h-3 mr-2" />
        {{ post.like }}
        <MessageCircle class="w-3 h-3 ml-4 mr-2" />
        {{ showReadableNumber(post.comment) }}
        <Eye class="w-3 h-3 ml-4 mr-2" />
        {{ showReadableNumber(post.hit) }}
        <div class="flex-1"></div>
        <span class="hidden xl:block">{{ showDateOnly(post.submitted) }}</span>
      </CardDescription>
    </CardHeader>
    <CardContent class="text-sm line-clamp-3 leading-5 px-3">{{
      stripHtmlTags(post.content)
    }}</CardContent>
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
