<template>
  <section>
    <div class="mb-5 flex items-end justify-between gap-4">
      <div class="min-w-0">
        <div class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Journal</div>
        <h2 class="truncate text-2xl font-semibold tracking-[-0.025em]">
          {{ recoverChars(latest.config.name) }}
        </h2>
        <p class="mt-1 truncate text-sm text-muted-foreground">
          {{ recoverChars(latest.config.info) }}
        </p>
      </div>
      <NuxtLink
        :to="`/board/${latest.config.id}/page/1`"
        class="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        모든 글 <ArrowRightIcon class="size-4" />
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <NuxtLink
        v-for="post in latest.items"
        :key="post.uid"
        :to="`/board/${post.id}/${post.uid}`"
        class="group grid min-h-44 grid-cols-[minmax(0,1fr)_7.5rem] gap-5 rounded-2xl border border-border/70 bg-card/70 p-5 transition-colors hover:bg-card sm:grid-cols-[minmax(0,1fr)_10rem]"
      >
        <div class="flex min-w-0 flex-col">
          <div class="text-xs text-muted-foreground">
            {{ recoverChars(post.writer.name) }} · {{ date(post.submitted) }}
          </div>
          <h3 class="mt-3 line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary">
            {{ recoverChars(post.title) }}
          </h3>
          <p class="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {{ recoverChars(stripTags(post.content)) }}
          </p>
          <div class="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1">
              <HeartIcon class="size-3.5" /> {{ num(post.like) }}
            </span>
            <span class="inline-flex items-center gap-1">
              <MessageCircleIcon class="size-3.5" /> {{ num(post.comment) }}
            </span>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl bg-media">
          <img
            v-if="post.cover"
            :src="post.cover"
            :alt="recoverChars(post.title)"
            loading="lazy"
            class="h-full min-h-32 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          />
          <div v-else class="flex h-full items-center justify-center text-media-foreground/45">
            <BookOpenIcon class="size-6" />
          </div>
        </div>
      </NuxtLink>
    </div>

    <div
      v-if="latest.items.length === 0"
      class="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground"
    >
      아직 등록된 글이 없습니다.
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowRightIcon,
  BookOpenIcon,
  HeartIcon,
  MessageCircleIcon,
} from "lucide-vue-next"
import type { HomePostResult } from "~/types/home"

defineProps<{ latest: HomePostResult }>()
</script>
