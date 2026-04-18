<template>
  <Landing v-model="isLanding" v-if="!isSearching && isLanding" />
  <LatestPosts v-else />
</template>

<script setup lang="ts">
import Landing from "./Landing.vue"
import LatestPosts from "./LatestPosts.vue"

const route = useRoute()
const isLanding = ref<boolean>(true)
const isSearching = computed(
  () => route.params.keyword !== undefined && route.params.keyword.length > 1,
)
</script>
