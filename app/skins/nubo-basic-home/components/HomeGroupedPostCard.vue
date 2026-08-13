<template>
  <div class="space-y-12 md:space-y-16">
    <template v-for="latest in latests" :key="latest.config.id">
      <HomeGallerySection v-if="latest.config.type === BOARD.GALLERY" :latest="latest" />
      <HomeBlogSection v-else-if="latest.config.type === BOARD.BLOG" :latest="latest" />
      <HomeBoardSection v-else :latest="latest" />
    </template>
  </div>
</template>

<script setup lang="ts">
import HomeBlogSection from "./HomeBlogSection.vue"
import HomeBoardSection from "./HomeBoardSection.vue"
import HomeGallerySection from "./HomeGallerySection.vue"
import { useNuboHomeContext } from "~/providers/contexts/home"
import { BOARD } from "~/types/board"
import type { HomePostResult } from "~/types/home"
import { boards } from "../boards.json"

const { getPostsById } = useNuboHomeContext()
const latests = ref<HomePostResult[]>(
  await Promise.all(boards.map((board) => getPostsById(board.id, board.limit))),
)
</script>
