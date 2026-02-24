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
        v-for="(co, index) in userLatestComments"
        :key="index"
        class="text-sm p-2 rounded-md hover:bg-muted transition-colors"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1">
            <NuxtLink :to="`/board/${co.board.id}/${co.postUid}`">
              <span class="line-clamp-1">{{ stripTags(co.content) }}</span>
            </NuxtLink>
          </div>

          <div class="text-xs text-muted-foreground">
            <span class="shrink-0">{{ date(co.submitted) }}</span>
          </div>
        </div>
      </div>

      <div v-if="userLatestComments.length < 1" class="text-muted text-center">
        아직 작성한 댓글이 없습니다
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { MessageCircleIcon } from "lucide-vue-next"
import { useNuboProfileContext } from "~/providers/contexts/profile"

const { userLatestComments } = useNuboProfileContext()
</script>
