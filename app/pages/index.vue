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

    <CommonVTooltip content="이전 게시글들을 더 불러옵니다">
      <Button
        @click="home.loadMore"
        :disabled="pending"
        class="text-foreground w-full mt-4 cursor-pointer"
        variant="outline"
        size="lg"
      >
        <ArrowDownFromLine />
        더 불러오기</Button
      ></CommonVTooltip
    >

    <div class="py-6"></div>
  </section>
</template>

<script setup lang="ts">
import { ArrowDownFromLine } from "lucide-vue-next"
import { storeToRefs } from "pinia"
import "vue-sonner/style.css"
import { SEARCH, type Search } from "~/types/board"

const home = useHomeStore()
const { posts, pending } = storeToRefs(home)

home.option = SEARCH.TITLE as Search
home.keyword = ""
await home.getLatestPosts({ reset: true })
</script>
