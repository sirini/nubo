<template>
  <div class="flex items-center justify-between gap-4">
    <div class="inline-flex min-w-0 items-center gap-3">
      <Avatar class="size-11 border border-border/70">
        <AvatarImage :src="view.post.writer.profile" :alt="recoverChars(view.post.writer.name)" />
        <AvatarFallback>{{ recoverChars(view.post.writer.name).charAt(0) }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0">
        <h3 class="truncate font-semibold tracking-tight">
          {{ recoverChars(view.post.writer.name) }}
        </h3>
        <p v-if="view.post.writer.signature" class="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {{ recoverChars(view.post.writer.signature) }}
        </p>
      </div>
    </div>

    <Button variant="ghost" size="sm" class="shrink-0 cursor-pointer text-muted-foreground" as-child>
      <NuxtLink :to="`/user/${view.post.writer.uid}`">
        프로필 <ArrowRightIcon class="ml-1 h-4 w-4" />
      </NuxtLink>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ArrowRightIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view } = useNuboViewContext()
</script>
