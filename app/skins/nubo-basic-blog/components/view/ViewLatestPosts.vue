<template>
  <Card class="gap-0 py-0 shadow-none">
    <CardHeader class="border-b border-border/60 px-5 py-4">
      <CardTitle class="flex items-center gap-2 text-sm font-semibold">
        <NotepadTextIcon class="w-4 h-4" />
        최근 게시글들</CardTitle
      >
    </CardHeader>
    <CardContent class="grid px-3 py-2">
      <div
        v-for="(post, index) in view.writerPosts"
        :key="index"
        class="rounded-lg p-2 text-sm transition-colors hover:bg-accent/45"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1">
            <NuxtLink :to="`/board/${post.board.id}/${post.postUid}`">
              <span class="line-clamp-1">{{ recoverChars(post.title) }}</span>
            </NuxtLink>
          </div>

          <div class="text-xs text-muted-foreground">
            <span class="shrink-0">{{ date(post.submitted) }}</span>
          </div>
        </div>
      </div>

      <div v-if="view.writerPosts.length < 1" class="p-4 text-center text-sm text-muted-foreground">
        아직 작성한 게시글이 없습니다
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { NotepadTextIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view } = useNuboViewContext()
</script>
