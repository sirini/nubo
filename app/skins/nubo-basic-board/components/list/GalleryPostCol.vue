<template>
  <article
    v-for="post in posts"
    :key="post.uid"
    class="group mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-border/70 bg-card/70 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card"
  >
    <NuxtLink :to="`/board/${config.id}/${post.uid}`" class="block">
      <div class="relative overflow-hidden bg-media">
        <img
          v-if="post.cover"
          :src="post.cover"
          :alt="recoverChars(post.title)"
          loading="lazy"
          class="h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
        <div
          v-else
          class="flex aspect-4/3 items-center justify-center text-sm text-media-foreground/55"
        >
          이미지가 없습니다
        </div>
        <div
          v-if="post.status === STATUS.SECRET"
          class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-media/75 px-2.5 py-1 text-xs text-media-foreground backdrop-blur-md"
        >
          <LockIcon class="size-3" /> 비밀글
        </div>
      </div>

      <div class="p-4">
        <div
          v-if="config.useCategory && post.category.name"
          class="mb-2 text-xs font-medium text-primary"
        >
          {{ recoverChars(post.category.name) }}
        </div>
        <h2 class="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
          {{ recoverChars(post.title) }}
        </h2>
        <div class="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span class="min-w-0 truncate">
            {{ recoverChars(post.writer.name) }} · {{ date(post.submitted) }}
          </span>
          <span class="flex shrink-0 items-center gap-3">
            <span class="inline-flex items-center gap-1">
              <HeartIcon
                class="size-3.5"
                :class="post.liked ? 'fill-current text-primary' : ''"
              />
              {{ num(post.like) }}
            </span>
            <span class="inline-flex items-center gap-1">
              <MessageCircleIcon class="size-3.5" /> {{ num(post.comment) }}
            </span>
            <span class="inline-flex items-center gap-1">
              <EyeIcon class="size-3.5" /> {{ num(post.hit) }}
            </span>
          </span>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
import { EyeIcon, HeartIcon, LockIcon, MessageCircleIcon } from "lucide-vue-next"
import { useNuboListContext } from "~/providers/contexts/list"
import { STATUS } from "~/types/board"

const { config, posts } = useNuboListContext()
</script>
