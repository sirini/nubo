<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <div v-if="!isSearching" class="mb-10 border-b border-border/70 pb-7 sm:mb-14">
      <div class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Community
      </div>
      <h1 class="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">새로운 이야기</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        지금 커뮤니티에서 나누고 있는 사진과 글을 한곳에서 만나보세요.
      </p>
    </div>

    <HomeGroupedPostCard v-if="!isSearching" />
    <HomeSearchedPostCard v-else />

    <div ref="scrollObserverRef" class="py-6"></div>
  </section>
</template>

<script setup lang="ts">
import HomeSearchedPostCard from "./components/HomeSearchedPostCard.vue"
import HomeGroupedPostCard from "./components/HomeGroupedPostCard.vue"

const route = useRoute()
const isSearching = computed(
  () => route.params.keyword !== undefined && route.params.keyword.length > 1,
)
</script>
