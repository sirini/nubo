<template>
  <CardHeader class="px-3">
    <CardTitle class="my-2 text-2xl font-title px-1 leading-10">{{
      recoverChars(view.post.title)
    }}</CardTitle>
    <CardDescription class="inline-flex items-center px-1 font-mono">
      <ViewStatusLine />
    </CardDescription>
  </CardHeader>
  <CardContent class="nubo leading-7 px-4">
    <div v-html="view.post.content"></div>
  </CardContent>
  <CardFooter class="px-4 justify-between">
    <ViewTagBadges />
    <ViewLikeButton />
  </CardFooter>

  <div v-if="view.post.writer.signature.length > 0">
    <hr />
    <div class="text-muted-foreground text-xs pt-3 px-4">
      {{ view.post.writer.signature }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/types/nubo-skin-keys"
import ViewLikeButton from "./ViewLikeButton.vue"
import ViewStatusLine from "./ViewStatusLine.vue"
import ViewTagBadges from "./ViewTagBadges.vue"

const { view } = useNuboViewContext()
</script>
