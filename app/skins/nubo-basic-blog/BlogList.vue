<template>
  <section class="mx-auto px-4 py-8 sm:px-6 sm:py-12">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <BlogHeader class="mb-8 sm:mb-10" />
      <BlogPostRow />
    </div>
    <div class="mx-auto mt-10" :style="`max-width: ${config.width}px`">
      <ListFooter />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useNuboListContext } from "~/providers/contexts/list"
import BlogHeader from "./components/list/BlogHeader.vue"
import BlogPostRow from "./components/list/BlogPostRow.vue"
import ListFooter from "../nubo-basic-board/components/list/ListFooter.vue"

// config.width는 관리자가 정한 콘텐츠 최대 폭이며 반응형 바깥 여백과 함께 적용됩니다.
const { config } = useNuboListContext()
</script>
