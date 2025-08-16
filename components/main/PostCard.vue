<template>
  <Card class="relative overflow-hidden rounded-xl shadow-lg">
    <div class="w-full aspect-[1/1] overflow-hidden" v-if="post.cover">
      <img
        :src="post.cover"
        alt="cover image"
        class="absolute w-full aspect-[1/1] inset-0 object-cover transition-transform hover:scale-105"
      />
    </div>
    <CardHeader>
      <CardTitle class="leading-6 mb-2">{{ post.title }}</CardTitle>
      <CardDescription class="inline-flex items-center">
        <Heart :class="post.liked ? 'text-red-200 fill-current' : ''" class="w-3 h-3 mr-2" />
        {{ post.like }}
        <MessageCircle class="w-3 h-3 ml-4 mr-2" />
        {{ showReadableNumber(post.comment) }}
        <Eye class="w-3 h-3 ml-4 mr-2" />
        {{ showReadableNumber(post.hit) }}
        <div class="flex-1"></div>
        {{ showDateOnly(post.submitted) }}
      </CardDescription>
    </CardHeader>
    <CardContent class="text-sm line-clamp-5 leading-5">{{
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
