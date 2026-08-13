<template>
  <Card class="mb-8 overflow-hidden border-0 bg-transparent p-0 shadow-none">
    <CardHeader class="p-0">
      <CardTitle class="text-2xl flex items-center gap-2 pl-1">
        <SearchIcon class="w-5 h-5" />
        <span>{{ keyword }} 검색</span>
      </CardTitle>
      <CardDescription>
        <Badge variant="outline" class="text-muted-foreground p-2">
          {{ optionLabels[option] }} 에서 {{ keyword }} 키워드가 있는 모든 게시글을 검색합니다
        </Badge>
      </CardDescription>
    </CardHeader>
  </Card>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <Card
      class="overflow-hidden rounded-2xl pt-0 shadow-none"
      v-for="(post, index) in posts"
      :key="index"
    >
      <NuxtLink :to="`/board/${post.id}/${post.uid}`">
        <div v-if="post.cover">
          <img
            :src="post.cover"
            alt="cover image"
            class="w-full aspect-video object-cover transition-transform"
          />
        </div>

        <div
          v-else
          class="flex items-center bg-accent-foreground/5 justify-center w-full h-auto aspect-video transition-transform text-muted font-mono"
        >
          NO IMG
        </div>

        <Separator />

        <CardHeader class="px-3">
          <CardTitle
            class="line-clamp-1 mb-2 mt-4"
            :class="post.cover ? '' : 'line-clamp-6 leading-6'"
          >
            <span class="hover:text-primary transition-colors line-clamp-1">
              {{ recoverChars(post.title) }}
            </span>
          </CardTitle>
          <CardDescription class="inline-flex items-center font-mono text-xs">
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
        <CardContent class="text-sm line-clamp-3 leading-6 px-3 mt-2 text-muted-foreground"
          >{{ recoverChars(stripTags(post.content.slice(0, 300))) }}
        </CardContent>
      </NuxtLink>
    </Card>
  </div>

  <CommonVTooltip content="이전 게시글들을 더 불러옵니다" v-if="!isLastPost">
    <Button
      @click="loadMorePosts"
      class="text-foreground w-full mt-4 cursor-pointer"
      variant="outline"
      size="lg"
    >
      <ArrowDownFromLineIcon />
      더 불러오기</Button
    ></CommonVTooltip
  >

  <div
    class="mt-8 flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 p-3 text-muted-foreground"
    v-if="isLastPost"
  >
    <CheckCircle2Icon class="w-4 h-4" />
    모든 게시글을 가져왔습니다
  </div>
</template>

<script setup lang="ts">
import {
  ArrowDownFromLineIcon,
  CheckCircle2Icon,
  EyeIcon,
  HeartIcon,
  MessageCircleIcon,
  SearchIcon,
} from "lucide-vue-next"
import { date, num, stripTags } from "~/composables/useUtils"
import { useNuboHomeContext } from "~/providers/contexts/home"

const { isLastPost, posts, option, optionLabels, keyword, loadMorePosts } = useNuboHomeContext()
const scrollObserverRef = ref<HTMLDivElement | null>(null)
const { stop } = useIntersectionObserver(
  scrollObserverRef,
  (isIntersecting) => {
    if (isLastPost.value) {
      stop()
      return
    }

    if (isIntersecting) {
      loadMorePosts()
    }
  },
  {
    threshold: 0.4,
    rootMargin: "100px",
  },
)
</script>
