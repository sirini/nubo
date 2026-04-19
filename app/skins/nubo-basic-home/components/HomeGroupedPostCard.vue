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
                <div v-if="post.cover" class="relative">
                  <img
                    :src="post.cover"
                    alt="cover image"
                    class="w-full aspect-video object-cover transition-transform"
                  />
                  <div
                    class="absolute bottom-0 w-full h-full bg-linear-to-t from-[#15151F]/50 to-transparent"
                  ></div>
                </div>

                <div
                  v-else
                  class="flex items-center justify-center w-full p-3 h-42 aspect-video transition-transform tracking-wider text-muted-foreground line-clamp-6"
                >
                  {{ recoverChars(stripTags(post.content)) }}
                </div>

                <CardHeader class="p-4">
                  <CardTitle class="line-clamp-1 mb-2">
                    <span class="hover:text-primary transition-colors">
                      {{ recoverChars(post.title) }}
                    </span>
                  </CardTitle>
                  <CardDescription class="flex items-center justify-between">
                    <div class="font-mono flex items-center">
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
                    </div>

                    <div class="w-30 flex items-center">
                      <UserIcon class="w-3 h-3 mr-2" />
                      <span class="line-clamp-1">{{ recoverChars(post.writer.name) }}</span>
                    </div>
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
import { EyeIcon, HeartIcon, MessageCircleIcon, MilestoneIcon, UserIcon } from "lucide-vue-next"
import { useNuboHomeContext } from "~/providers/contexts/home"
import type { HomePostResult } from "~/types/home"
import { boards } from "../boards.json"

const { getPostsById } = useNuboHomeContext()
const latests = ref<HomePostResult[]>([])

// nubo-basic-home/boards.json 에서 지정한 게시판들을 개수에 맞춰 가져오기
for (const board of boards) {
  const result = await getPostsById(board.id, board.limit)
  latests.value.push(result)
}
</script>
