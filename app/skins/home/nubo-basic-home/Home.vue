<template>
  <section class="container mx-auto py-4">
    <HeroSection />

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      <HomeMainPostCard :post="post" v-for="post in posts" :key="post.uid" />
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
    >
      <CheckCircle2Icon class="w-4 h-4" />
      모든 게시글을 가져왔습니다
    </div>

    <div ref="scrollObserverRef" class="py-6"></div>
  </section>
</template>

<script setup lang="ts">
import { ArrowDownFromLineIcon, CheckCircle2Icon } from "lucide-vue-next"
import { Spinner } from "~/components/ui/spinner"
import { useNuboHomeContext } from "~/types/nubo-skin-keys"
import HeroSection from "./components/HeroSection.vue"
import HomeMainPostCard from "./components/HomeMainPostCard.vue"

const scrollObserverRef = ref<HTMLDivElement | null>(null)
const { isLoading, isLastPost, posts, loadMorePosts } = useNuboHomeContext()

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
    threshold: 0.8,
    rootMargin: "0px",
  },
)
</script>
