<template>
  <Card class="gap-0 py-0 shadow-none">
    <CardHeader class="border-b border-border/60 px-5 py-4">
      <CardTitle class="flex items-center gap-2 text-sm font-semibold">
        <MessageCircleIcon class="w-4 h-4" />
        최근 댓글들</CardTitle
      >
    </CardHeader>
    <CardContent class="grid px-3 py-2">
      <div
        v-for="(co, index) in view.writerComments"
        :key="index"
        class="rounded-lg p-2 text-sm transition-colors hover:bg-accent/45"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1">
            <NuxtLink :to="`/board/${co.board.id}/${co.postUid}`">
              <span class="line-clamp-1">{{ recoverChars(stripTags(co.content)) }}</span>
            </NuxtLink>
          </div>

          <div class="text-xs text-muted-foreground">
            <span class="shrink-0">{{ date(co.submitted) }}</span>
          </div>
        </div>
      </div>

      <div v-if="view.writerComments.length < 1" class="p-4 text-center text-sm text-muted-foreground">
        아직 작성한 댓글이 없습니다
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { MessageCircleIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view } = useNuboViewContext()
</script>
