<template>
  <Card class="bg-background text-foreground">
    <CardHeader>
      <div class="flex items-center justify-between">
        <h2>{{ post.title }}</h2>
        <span>{{ post.submitted }}</span>
      </div>
    </CardHeader>
    <CardContent>
      <img v-if="post.cover" :src="post.cover" />
      <p>{{ post.content }}</p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { BoardHomePostItem } from "~/types/home"
import { Card, CardContent, CardHeader } from "../ui/card"

const props = defineProps<{
  post: BoardHomePostItem
}>()
</script>
