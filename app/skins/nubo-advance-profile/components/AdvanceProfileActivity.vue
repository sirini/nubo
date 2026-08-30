<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base"><NotepadTextIcon class="size-4" />최근 게시글</CardTitle>
        <CardDescription>공개된 최근 활동입니다.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-1">
        <NuxtLink v-for="post in userLatestPosts" :key="`${post.board.id}-${post.postUid}`" :to="`/board/${post.board.id}/${post.postUid}`" class="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted">
          <span class="min-w-0 flex-1 truncate">{{ recoverChars(post.title) }}</span>
          <span class="shrink-0 text-xs text-muted-foreground">{{ date(post.submitted) }}</span>
        </NuxtLink>
        <p v-if="!userLatestPosts.length" class="py-10 text-center text-sm text-muted-foreground">아직 작성한 게시글이 없습니다.</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base"><MessageCircleIcon class="size-4" />최근 댓글</CardTitle>
        <CardDescription>최근에 남긴 공개 댓글입니다.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-1">
        <NuxtLink v-for="(comment, index) in userLatestComments" :key="`${comment.board.id}-${comment.postUid}-${index}`" :to="`/board/${comment.board.id}/${comment.postUid}`" class="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted">
          <span class="min-w-0 flex-1 truncate">{{ recoverChars(stripTags(comment.content)) }}</span>
          <span class="shrink-0 text-xs text-muted-foreground">{{ date(comment.submitted) }}</span>
        </NuxtLink>
        <p v-if="!userLatestComments.length" class="py-10 text-center text-sm text-muted-foreground">아직 작성한 댓글이 없습니다.</p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { MessageCircleIcon, NotepadTextIcon } from "lucide-vue-next"
import { useNuboProfileContext } from "~/providers/contexts/profile"

const { userLatestComments, userLatestPosts } = useNuboProfileContext()
</script>
