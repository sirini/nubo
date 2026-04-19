<template>
  <Landing v-if="!isSearching && isLanding" />
  <LatestPosts v-else />
</template>

<script setup lang="ts">
import { useNuboHomeContext } from "~/providers/contexts/home"
import Landing from "./Landing.vue"
import LatestPosts from "./LatestPosts.vue"

const route = useRoute()
const isSearching = computed(
  () => route.params.keyword !== undefined && route.params.keyword.length > 1,
)
const { isLanding } = useNuboHomeContext()
</script>
