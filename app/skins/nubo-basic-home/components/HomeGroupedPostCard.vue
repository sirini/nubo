<template>
  <div class="space-y-12">
    <div v-for="(latest, index) in latests" :key="index">
      <Card class="overflow-hidden border-0 p-0 rounded-none">
        <CardHeader class="p-0">
          <CardTitle class="text-2xl flex items-center gap-2 pl-1">
            <MilestoneIcon class="w-5 h-5" />
            <NuxtLink
              :to="`/board/${latest.config.id}`"
              class="hover:text-primary transition-colors"
              >{{ recoverChars(latest.config.name) }}</NuxtLink
            >
          </CardTitle>
          <CardDescription class="inline-flex items-center">
            <Badge variant="outline" class="text-muted-foreground p-2">
              {{ recoverChars(latest.config.info) }}</Badge
            ></CardDescription
          >
        </CardHeader>
        <CardContent
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-0"
        >
          <div v-for="(post, index) in latest.items" :key="index">
            <div class="border rounded-xl overflow-hidden shadow-2xl">
              <NuxtLink :to="`/board/${post.id}/${post.uid}`">
                <img
                  v-if="post.cover"
                  :src="post.cover"
                  alt="cover image"
                  class="w-full aspect-square object-cover transition-transform hover:scale-105"
                />

                <div
                  v-else
                  class="flex items-center justify-center w-full h-66.5 aspect-square transition-transform hover:scale-105 font-mono tracking-wider text-muted"
                >
                  NO IMAGE
                </div>

                <CardHeader class="p-4">
                  <CardTitle
                    class="line-clamp-1 mb-2 mt-4"
                    :class="post.cover ? '' : 'line-clamp-6 leading-6'"
                    >{{ recoverChars(post.title) }}</CardTitle
                  >
                  <CardDescription class="inline-flex items-center font-mono">
                    <HeartIcon
                      :class="post.liked ? 'text-red-200 fill-current' : ''"
                      class="w-3 h-3 mr-2"
                    />
                    {{ post.like }}
                    <MessageCircleIcon class="w-3 h-3 ml-4 mr-2" />
                    {{ num(post.comment) }}
                    <EyeIcon class="w-3 h-3 ml-4 mr-2" />
                    {{ num(post.hit) }}
                    <span class="flex-1"></span>
                    <UserIcon class="w-3 h-3 mr-2" />
                    {{ recoverChars(post.writer.name) }}
                  </CardDescription>
                </CardHeader>
              </NuxtLink>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuboHomeContext } from "~/providers/contexts/home"
import { boards } from "../boards.json"
import type { HomePostResult } from "~/types/home"
import { EyeIcon, HeartIcon, MessageCircleIcon, MilestoneIcon, UserIcon } from "lucide-vue-next"

const { getPostsById } = useNuboHomeContext()
const latests = ref<HomePostResult[]>([])

// nubo-basic-home/boards.json 에서 지정한 게시판들을 개수에 맞춰 가져오기
for (const board of boards) {
  const result = await getPostsById(board.id, board.limit)
  latests.value.push(result)
}
</script>
