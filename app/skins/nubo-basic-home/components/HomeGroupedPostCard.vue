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
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-0 py-3"
        >
          <div v-for="(post, index) in latest.items" :key="index">
            <Card class="rounded-xl overflow-hidden shadow-xl p-0">
              <NuxtLink :to="`/board/${post.id}/${post.uid}`">
                <div v-if="post.cover">
                  <img
                    :src="post.cover"
                    alt="cover image"
                    class="w-full aspect-4/3 object-cover transition-transform"
                  />
                </div>

                <div
                  v-else
                  class="flex items-center justify-center w-full p-3 aspect-4/3 transition-transform tracking-wider text-muted text-sm overflow-hidden"
                >
                  {{ recoverChars(stripTags(post.content.slice(0, 250))) }}
                </div>

                <Separator />

                <CardHeader class="p-4">
                  <CardTitle class="line-clamp-1 mb-2">
                    <span class="hover:text-primary transition-colors">
                      {{ recoverChars(post.title) }}
                    </span>
                  </CardTitle>
                  <CardDescription class="flex items-center justify-between">
                    <div class="font-mono flex items-center text-xs">
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
                  </CardDescription>
                </CardHeader>
              </NuxtLink>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, HeartIcon, MessageCircleIcon, MilestoneIcon } from "lucide-vue-next"
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
