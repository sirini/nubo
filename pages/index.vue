<template>
  <section class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-if="pending && posts.length === 0">Loading ...</div>
      <div v-else>
        <main-post-card v-for="post in posts" :key="post.uid" :post="post" />

        <button @click="loadMore" :disabled="pending">더보기</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useLatestPosts } from "~/composables/useLatestPosts"

// SSR 시점에 데이터 먼저 가져오기
const { posts, pending, error, loadMore } = await useLatestPosts()
</script>
