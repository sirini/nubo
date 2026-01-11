<template>
  <div class="min-h-screen bg-background mx-auto py-4" :style="`max-width: ${config.width}px`">
    <BlogHeader />

    <section class="container mx-auto py-16 md:py-24">
      <div class="space-y-12 md:space-y-16">
        <BlogPostRow />
      </div>

      <div class="py-8"></div>
      <ListFooter />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useNuboListContext } from "~/types/nubo-skin-keys"
import BlogHeader from "./components/list/BlogHeader.vue"
import BlogPostRow from "./components/list/BlogPostRow.vue"
import ListFooter from "./components/list/ListFooter.vue"

const { config } = useNuboListContext()
</script>
