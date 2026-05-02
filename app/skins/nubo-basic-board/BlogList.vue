<template>
  <section class="container mx-auto p-4">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <BlogHeader class="my-6" />
      <BlogPostRow />
    </div>
    <ListFooter />
  </section>
</template>

<script setup lang="ts">
import { useNuboListContext } from "~/providers/contexts/list"
import BlogHeader from "./components/list/BlogHeader.vue"
import BlogPostRow from "./components/list/BlogPostRow.vue"
import ListFooter from "./components/list/ListFooter.vue"

const { config } = useNuboListContext()
</script>
