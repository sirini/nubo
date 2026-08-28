<template>
  <article
    class="group overflow-hidden rounded-2xl border border-border/75 bg-card shadow-sm transition hover:border-border hover:shadow-md"
  >
    <div class="flex min-w-0">
      <aside class="hidden w-12 shrink-0 justify-center bg-muted/45 py-3 sm:flex">
        <button
          type="button"
          class="flex h-fit min-w-9 cursor-pointer flex-col items-center gap-0.5 rounded-lg px-1.5 py-1.5 text-xs font-semibold transition-colors hover:bg-background/75 hover:text-primary"
          :class="post.liked ? 'text-primary' : 'text-muted-foreground'"
          :aria-label="post.liked ? '좋아요 취소' : '좋아요'"
          @click="$emit('toggle-like', post)"
        >
          <ArrowBigUpIcon class="size-5" :class="post.liked ? 'fill-current' : ''" />
          {{ num(post.like) }}
        </button>
      </aside>

      <div class="min-w-0 flex-1">
        <header class="px-4 pb-3 pt-4 sm:px-5">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <Badge v-if="post.status === STATUS.NOTICE" variant="secondary" class="gap-1">
              <PinIcon class="size-3" /> 공지
            </Badge>
            <NuxtLink
              :to="`/board/${post.id}/page/1`"
              class="max-w-48 truncate font-semibold text-foreground hover:text-primary hover:underline"
            >
              n/{{ post.id }}
            </NuxtLink>
            <span class="text-muted-foreground">{{ recoverChars(boardName) }}</span>
            <span class="text-muted-foreground/60" aria-hidden="true">·</span>
            <NuxtLink
              :to="`/user/${post.writer.uid}`"
              class="truncate text-muted-foreground hover:text-foreground hover:underline"
            >
              {{ recoverChars(post.writer.name) }}
            </NuxtLink>
            <span class="text-muted-foreground/60" aria-hidden="true">·</span>
            <time class="text-muted-foreground">{{ dateFull(post.submitted) }}</time>
          </div>

          <NuxtLink :to="postPath" class="mt-2 block">
            <h2
              class="text-lg font-semibold leading-snug tracking-[-0.018em] transition-colors group-hover:text-primary sm:text-xl"
            >
              {{ recoverChars(post.title) }}
            </h2>
          </NuxtLink>

          <p v-if="excerpt" class="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {{ excerpt }}
          </p>
        </header>

        <button
          v-if="post.cover"
          type="button"
          class="relative block w-full cursor-zoom-in overflow-hidden border-y border-border/60 bg-media text-left"
          :aria-label="`${recoverChars(post.title)} 미디어 전체 화면으로 보기`"
          @click="$emit('open-media', post)"
        >
          <img
            :src="post.cover"
            :alt="recoverChars(post.title)"
            loading="lazy"
            class="mx-auto max-h-[34rem] min-h-48 w-full object-contain transition duration-300 group-hover:brightness-[0.97]"
          />
          <span
            class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white opacity-90 backdrop-blur transition group-hover:opacity-100"
          >
            <Maximize2Icon class="size-3.5" /> 크게 보기
          </span>
        </button>

        <footer class="flex flex-wrap items-center gap-1 px-3 py-2 text-xs text-muted-foreground sm:px-4">
          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 font-semibold transition-colors hover:bg-accent hover:text-primary sm:hidden"
            :class="post.liked ? 'text-primary' : ''"
            @click="$emit('toggle-like', post)"
          >
            <ArrowBigUpIcon class="size-4" :class="post.liked ? 'fill-current' : ''" />
            {{ num(post.like) }}
          </button>
          <NuxtLink
            :to="postPath"
            class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-semibold transition-colors hover:bg-accent hover:text-foreground"
          >
            <MessageCircleIcon class="size-4" /> 댓글 {{ num(post.comment) }}
          </NuxtLink>
          <span class="inline-flex items-center gap-1.5 px-2 py-1.5">
            <EyeIcon class="size-4" /> {{ num(post.hit) }}
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-1.5">
            <component :is="typeIcon" class="size-4" /> {{ typeLabel }}
          </span>
          <NuxtLink
            :to="postPath"
            class="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium transition-colors hover:bg-accent hover:text-foreground"
          >
            글 보기 <ArrowUpRightIcon class="size-3.5" />
          </NuxtLink>
        </footer>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  ArrowBigUpIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  EyeIcon,
  ImageIcon,
  Maximize2Icon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  PinIcon,
  ShoppingBagIcon,
} from "lucide-vue-next"
import type { Component } from "vue"
import { BOARD, STATUS } from "~/types/board"
import type { HomePostItem } from "~/types/home"

const props = defineProps<{ post: HomePostItem; boardName: string }>()
defineEmits<{
  "open-media": [post: HomePostItem]
  "toggle-like": [post: HomePostItem]
}>()

const postPath = computed(() => `/board/${props.post.id}/${props.post.uid}`)
const excerpt = computed(() =>
  recoverChars(stripTags(props.post.content)).replace(/\s+/g, " ").trim().slice(0, 320),
)
const typeMeta: Record<number, { label: string; icon: Component }> = {
  [BOARD.DEFAULT]: { label: "게시글", icon: MessageSquareTextIcon },
  [BOARD.GALLERY]: { label: "사진", icon: ImageIcon },
  [BOARD.BLOG]: { label: "블로그", icon: BookOpenIcon },
  [BOARD.TRADE]: { label: "거래", icon: ShoppingBagIcon },
}
const typeLabel = computed(() => typeMeta[props.post.type]?.label || "게시글")
const typeIcon = computed(() => typeMeta[props.post.type]?.icon || MessageSquareTextIcon)
</script>
