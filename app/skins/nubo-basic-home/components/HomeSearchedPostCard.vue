<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <Card
      class="overflow-hidden rounded-lg shadow-lg pt-0"
      v-for="(post, index) in posts"
      :key="index"
    >
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

        <CardHeader class="px-3">
          <CardTitle
            class="line-clamp-1 mb-2 mt-4"
            :class="post.cover ? '' : 'line-clamp-6 leading-6'"
          >
            <span class="hover:text-primary transition-colors">
              {{ recoverChars(post.title) }}
            </span>
          </CardTitle>
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
            <span class="hidden xl:inline">{{ date(post.submitted) }}</span>
          </CardDescription>
        </CardHeader>
        <CardContent class="text-sm line-clamp-3 leading-6 px-3 mt-2"
          >{{ recoverChars(stripTags(post.content)) }}
        </CardContent>
      </NuxtLink>
    </Card>
  </div>

  <CommonVTooltip content="이전 게시글들을 더 불러옵니다" v-if="!isLastPost">
    <Button
      @click="loadMorePosts"
      :disabled="isLoading"
      class="text-foreground w-full mt-4 cursor-pointer"
      variant="outline"
      size="lg"
    >
      <Spinner v-if="isLoading" />
      <ArrowDownFromLineIcon v-else />
      더 불러오기</Button
    ></CommonVTooltip
  >

  <div
    class="border rounded-lg shadow-lg text-muted-foreground flex items-center justify-center gap-2 p-3 mt-8"
    v-if="isLastPost"
  >
    <CheckCircle2Icon class="w-4 h-4" />
    모든 게시글을 가져왔습니다
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, HeartIcon, MessageCircleIcon } from "lucide-vue-next"
import { date, num, stripTags } from "~/composables/useUtils"
import { useNuboHomeContext } from "~/providers/contexts/home"

const { isLoading, isLastPost, posts, loadMorePosts } = useNuboHomeContext()
const scrollObserverRef = ref<HTMLDivElement | null>(null)
const { stop } = useIntersectionObserver(
  scrollObserverRef,
  (isIntersecting) => {
    if (isLastPost.value) {
      stop()
      return
    }

    if (isIntersecting && !isLoading.value) {
      loadMorePosts()
    }
  },
  {
    threshold: 0.4,
    rootMargin: "100px",
  },
)
</script>
