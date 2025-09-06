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
      @click="home.loadMore"
      :disabled="pending"
      class="text-foreground w-full mt-4 cursor-pointer"
      variant="outline"
      size="lg"
    >
      <ArrowDownFromLine />
      더 불러오기</Button
    >
  </section>
  <Toaster />
</template>

<script setup lang="ts">
import { ArrowDownFromLine } from "lucide-vue-next"
import { storeToRefs } from "pinia"
import "vue-sonner/style.css"
import { Toaster } from "~/components/ui/sonner"

const home = useHomeStore()
const colorMode = useColorMode()
colorMode.preference = "dark"

const { posts, pending } = storeToRefs(home)

await callOnce(() => home.fetchLatest({ reset: true }))
</script>
