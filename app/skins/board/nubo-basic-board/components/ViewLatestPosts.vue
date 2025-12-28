<template>
  <Card class="md:col-span-2 md:row-span-1">
    <CardHeader class="border-b">
      <CardTitle class="font-medium flex items-center gap-2">
        <NotepadTextIcon class="w-4 h-4" />
        최근 게시글들</CardTitle
      >
    </CardHeader>
    <CardContent class="grid px-2">
      <div
        v-for="(post, index) in view.writerPosts"
        :key="index"
        class="text-sm p-2 rounded-md hover:bg-muted transition-colors"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1">
            <NuxtLink :to="`/board/${post.board.id}/view/${post.postUid}`">
              <span class="line-clamp-1">{{ post.title }}</span>
            </NuxtLink>
          </div>

          <div class="text-xs text-muted-foreground">
            <span class="shrink-0">{{ date(post.submitted) }}</span>
          </div>
        </div>
      </div>

      <div v-if="view.writerPosts.length < 1" class="text-muted text-center">
        아직 작성한 게시글이 없습니다
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { NotepadTextIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { view } = useNuboViewContext()
</script>
