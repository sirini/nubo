<template>
  <section class="mx-auto px-4 py-8 sm:px-6 sm:py-12">
    <div class="mx-auto" :style="`max-width: ${Math.max(config.width, 1080)}px`">
      <header class="mb-10 flex flex-col gap-7 border-b border-border/60 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-2xl">
          <p class="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Curated photography</p>
          <h1 class="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {{ recoverChars(config.name) }}
          </h1>
          <p class="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            {{ recoverChars(config.info) }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button v-if="isAdmin" variant="outline" size="icon" as-child>
            <NuxtLink :to="`/admin/board/${config.id}`" aria-label="게시판 관리">
              <SettingsIcon class="size-4" />
            </NuxtLink>
          </Button>
          <Button v-if="isLoggedIn" class="gap-2" as-child>
            <NuxtLink :to="`/board/${config.id}/write`">
              <ImageUpIcon class="size-4" /> 사진 올리기
            </NuxtLink>
          </Button>
          <Button v-else variant="outline" class="gap-2" as-child>
            <NuxtLink :to="`/auth/login?redirect=/board/${config.id}/page/${page}`">
              <LogInIcon class="size-4" /> 로그인
            </NuxtLink>
          </Button>
        </div>
      </header>

      <div v-if="posts.length" class="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
        <article v-for="post in posts" :key="post.uid" class="group mb-3 break-inside-avoid">
          <NuxtLink :to="`/board/${config.id}/${post.uid}`" class="relative block overflow-hidden rounded-xl bg-media">
            <img
              v-if="post.cover"
              :src="post.cover"
              :alt="recoverChars(post.title)"
              loading="lazy"
              class="h-auto w-full transition duration-500 group-hover:scale-[1.015] group-hover:brightness-90"
            />
            <div v-else class="flex aspect-4/3 items-center justify-center text-sm text-media-foreground/55">
              이미지가 없습니다
            </div>
            <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/30 to-transparent px-4 pb-4 pt-16 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <div class="flex items-end justify-between gap-4">
                <div class="min-w-0">
                  <p v-if="post.status === STATUS.SECRET" class="mb-1 inline-flex items-center gap-1 text-[11px] text-white/75">
                    <LockIcon class="size-3" /> 비밀글
                  </p>
                  <h2 class="truncate text-sm font-semibold">{{ recoverChars(post.title) }}</h2>
                  <p class="mt-1 truncate text-xs text-white/70">{{ recoverChars(post.writer.name) }}</p>
                </div>
                <span class="inline-flex shrink-0 items-center gap-1 text-xs text-white/80">
                  <HeartIcon class="size-3.5" :class="post.liked ? 'fill-current' : ''" />{{ num(post.like) }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>

      <div v-else class="rounded-2xl border border-dashed border-border py-24 text-center text-muted-foreground">
        아직 전시된 사진이 없습니다.
      </div>

      <footer class="mt-12 flex flex-col items-center gap-6 border-t border-border/60 pt-8">
        <div class="flex items-center gap-3">
          <Button variant="outline" :disabled="page <= 1" as-child>
            <NuxtLink :to="setPagingUrl(Math.max(1, page - 1))"><ChevronLeftIcon class="size-4" /> 이전</NuxtLink>
          </Button>
          <span class="min-w-20 text-center text-sm text-muted-foreground">{{ page }} / {{ pageCount }}</span>
          <Button variant="outline" :disabled="page >= pageCount" as-child>
            <NuxtLink :to="setPagingUrl(Math.min(pageCount, page + 1))">다음 <ChevronRightIcon class="size-4" /></NuxtLink>
          </Button>
        </div>
        <form class="flex w-full max-w-md gap-2" @submit.prevent="searchPost">
          <select v-model="option" class="rounded-lg border border-input bg-background px-3 text-sm">
            <option :value="SEARCH.TITLE">제목</option>
            <option :value="SEARCH.WRITER">작성자</option>
            <option :value="SEARCH.TAG">태그</option>
          </select>
          <Input v-model="keyword" aria-label="갤러리 검색어" placeholder="사진과 이야기를 검색하세요" />
          <Button type="submit" size="icon" aria-label="검색"><SearchIcon class="size-4" /></Button>
        </form>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon, ImageUpIcon, LockIcon, LogInIcon, SearchIcon, SettingsIcon } from "lucide-vue-next"
import { useNuboListContext } from "~/providers/contexts/list"
import { SEARCH, STATUS } from "~/types/board"

const { config, isAdmin, isLoggedIn, keyword, option, page, posts, searchPost, setPagingUrl, totalPostCount } = useNuboListContext()
const pageCount = computed(() => Math.max(1, Math.ceil(totalPostCount.value / Math.max(1, config.value.rowCount))))
</script>
