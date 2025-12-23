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
        v-for="(post, index) in auth.userLatestPosts"
        :key="index"
        class="text-sm p-2 rounded-md hover:bg-muted cursor-pointer transition-colors flex justify-between"
      >
        <span class="truncate">{{ post.title }}</span>
        <span class="text-xs text-muted-foreground whitespace-nowrap ml-2">{{
          date(post.submitted)
        }}</span>
      </div>

      <div v-if="auth.userLatestPosts.length < 1" class="text-muted text-center">
        아직 작성한 게시글이 없습니다
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { NotepadTextIcon } from "lucide-vue-next"

const auth = useAuthStore()
</script>
