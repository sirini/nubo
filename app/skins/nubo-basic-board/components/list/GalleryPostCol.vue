<template>
  <article
    v-for="post in posts"
    :key="post.uid"
    class="relative group break-inside-avoid overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
  >
    <NuxtLink :to="`/board/${config.id}/${post.uid}`">
      <div class="overflow-hidden">
        <img
          :src="post.cover"
          class="w-full h-auto object-cover transition-trawnsform duration-500 group-hover:scale-110"
        />
      </div>

      <div
        class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white"
      >
        <div class="font-bold truncate">{{ recoverChars(post.title) }}</div>
        <div class="flex flex-col items-left gap-2 mt-1 text-xs opacity-90">
          <div>{{ recoverChars(post.writer.name) }}</div>
          <div>
            <span class="inline-flex gap-2 items-center mr-4">
              <HeartIcon class="w-3 h-3" :class="post.liked ? 'fill-current' : ''" />
              {{ num(post.like) }}
            </span>

            <span class="inline-flex gap-2 items-center">
              <EyeIcon class="w-3 h-3" />
              {{ num(post.hit) }}
            </span>
          </div>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
import { EyeIcon, HeartIcon } from "lucide-vue-next"
import { useNuboListContext } from "~/providers/contexts/list"

const { config, posts } = useNuboListContext()
</script>
