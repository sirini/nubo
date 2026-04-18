<template>
  <section class="container mx-auto py-6 px-4">
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
