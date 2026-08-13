<template>
  <CardHeader class="px-5 pb-5 pt-7 sm:px-8 sm:pt-9">
    <div
      v-if="config.useCategory && view.post.category.name"
      class="mb-2 text-xs font-semibold text-primary"
    >
      {{ recoverChars(view.post.category.name) }}
    </div>
    <h1 class="break-keep text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
      {{ recoverChars(view.post.title) }}
    </h1>
    <CardDescription class="mt-3 flex flex-wrap items-center gap-y-2 text-xs">
      <ViewStatusLine />
    </CardDescription>
  </CardHeader>

  <Separator class="opacity-70" />

  <CardContent class="nubo min-h-56 px-5 py-8 text-[0.98rem] leading-8 sm:px-8 sm:py-10">
    <div v-html="sanitize(view.post.content)"></div>
  </CardContent>
  <CardFooter class="flex-wrap justify-between gap-4 px-5 pb-7 sm:px-8">
    <ViewTagBadges />
    <div class="flex gap-2">
      <ViewLikeButton />
      <ViewActionButton />
    </div>
  </CardFooter>

  <div v-if="view.post.writer.signature.length > 0">
    <Separator />
    <div class="px-5 py-4 text-xs leading-6 text-muted-foreground sm:px-8">
      {{ recoverChars(view.post.writer.signature) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import ViewActionButton from "./ViewActionButton.vue"
import ViewLikeButton from "./ViewLikeButton.vue"
import ViewStatusLine from "./ViewStatusLine.vue"
import ViewTagBadges from "./ViewTagBadges.vue"

const { view, config } = useNuboViewContext()
const { sanitize } = useSanitize()
</script>
