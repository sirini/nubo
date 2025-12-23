<template>
  <Card class="md:col-span-2 md:row-span-1">
    <CardHeader class="border-b">
      <CardTitle class="font-medium flex items-center gap-2">
        <MessageCircleIcon class="w-4 h-4" />
        최근 댓글들</CardTitle
      >
    </CardHeader>
    <CardContent class="grid px-2">
      <div
        v-for="(co, index) in auth.userLatestComments"
        :key="index"
        class="text-sm p-2 rounded-md hover:bg-muted cursor-pointer transition-colors flex justify-between overflow-hidden"
        @click="navigateTo(`/board/${co.board.id}/${co.postUid}`)"
      >
        <span class="truncate">{{ stripTags(co.content) }}</span>
        <span class="text-xs text-muted-foreground whitespace-nowrap ml-2">{{
          date(co.submitted)
        }}</span>
      </div>

      <div v-if="auth.userLatestComments.length < 1" class="text-muted text-center">
        아직 작성한 댓글이 없습니다
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { MessageCircleIcon } from "lucide-vue-next"

const auth = useAuthStore()
</script>
