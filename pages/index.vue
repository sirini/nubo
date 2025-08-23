<template>
  <section class="container mx-auto py-4">
    <div>
      <div v-if="pending && posts.length === 0">Loading ...</div>
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4"
      >
        <main-post-card :post="post" v-for="post in posts" :key="post.uid" />
      </div>
    </div>

    <Button
      @click="loadMore"
      :disabled="pending"
      class="text-foreground w-full mt-4 cursor-pointer"
      variant="outline"
      size="lg"
    >
      <ArrowDownFromLine />
      더 불러오기</Button
    >
  </section>
</template>

<script setup lang="ts">
import { ArrowDownFromLine } from "lucide-vue-next"
import { useLatestPosts } from "~/composables/home/useLatestPosts"

// SSR 시점에 데이터 먼저 가져오기
const { posts, pending, error, loadMore } = await useLatestPosts()
</script>
