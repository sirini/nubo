<template>
  <CardHeader class="px-3">
    <CardTitle class="text-2xl font-title pt-3 px-1 leading-10">{{
      recoverChars(view.post.title)
    }}</CardTitle>
    <CardDescription class="inline-flex items-center px-1 font-mono">
      <ViewStatusLine />
    </CardDescription>
  </CardHeader>

  <Separator />

  <CardContent class="nubo leading-7 px-4">
    <div v-html="sanitize(view.post.content)"></div>
  </CardContent>
  <CardFooter class="px-4 justify-between">
    <ViewTagBadges />
    <ViewLikeButton />
  </CardFooter>

  <div v-if="view.post.writer.signature.length > 0">
    <Separator />
    <div class="text-muted-foreground text-xs pt-3 px-4">
      {{ recoverChars(view.post.writer.signature) || "서명이 없습니다" }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import ViewLikeButton from "./ViewLikeButton.vue"
import ViewStatusLine from "./ViewStatusLine.vue"
import ViewTagBadges from "./ViewTagBadges.vue"

const { view } = useNuboViewContext()
const { sanitize } = useSanitize()
</script>
