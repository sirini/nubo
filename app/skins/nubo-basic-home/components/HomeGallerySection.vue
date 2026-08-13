<template>
  <section>
    <div class="mb-5 flex items-end justify-between gap-4">
      <div class="min-w-0">
        <div class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Gallery
        </div>
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
        사진 더 보기 <ArrowRightIcon class="size-4" />
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      <article v-for="post in latest.items" :key="post.uid" class="group min-w-0">
        <NuxtLink :to="`/board/${post.id}/${post.uid}`" class="block">
          <div class="overflow-hidden rounded-2xl bg-media">
            <img
              v-if="post.cover"
              :src="post.cover"
              :alt="recoverChars(post.title)"
              loading="lazy"
              class="aspect-4/3 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
            />
            <div
              v-else
              class="flex aspect-4/3 items-center justify-center text-sm text-media-foreground/60"
            >
              이미지가 없습니다
            </div>
          </div>

          <div class="px-1 pt-3">
            <h3 class="truncate font-medium tracking-[-0.01em] group-hover:text-primary">
              {{ recoverChars(post.title) }}
            </h3>
            <div class="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span class="truncate">{{ recoverChars(post.writer.name) }}</span>
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
              </span>
            </div>
          </div>
        </NuxtLink>
      </article>
    </div>

    <div
      v-if="latest.items.length === 0"
      class="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground"
    >
      아직 등록된 사진이 없습니다.
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon, HeartIcon, MessageCircleIcon } from "lucide-vue-next"
import type { HomePostResult } from "~/types/home"

defineProps<{ latest: HomePostResult }>()
</script>
