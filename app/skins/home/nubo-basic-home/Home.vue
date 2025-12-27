<template>
  <section class="container mx-auto py-4">
    <div>
      <div v-if="pending">Loading ...</div>
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4"
      >
        <HomeMainPostCard :post="post" v-for="post in posts" :key="post.uid" />
      </div>
    </div>

    <CommonVTooltip content="이전 게시글들을 더 불러옵니다">
      <Button
        @click="loadMorePosts"
        :disabled="pending"
        class="text-foreground w-full mt-4 cursor-pointer"
        variant="outline"
        size="lg"
      >
        <ArrowDownFromLineIcon />
        더 불러오기</Button
      ></CommonVTooltip
    >

    <div class="py-6"></div>
  </section>
</template>

<script setup lang="ts">
import { ArrowDownFromLineIcon } from "lucide-vue-next"
import { useNuboHomeContext } from "~/types/nubo-skin-keys"
import HomeMainPostCard from "./components/HomeMainPostCard.vue"

const { pending, posts, loadMorePosts } = useNuboHomeContext()
</script>
