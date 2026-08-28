<template>
  <aside class="hidden min-w-0 space-y-4 xl:block">
    <div class="sticky top-20 space-y-4">
      <section class="overflow-hidden rounded-2xl border border-border/75 bg-card shadow-sm">
        <div class="bg-linear-to-br from-primary/18 via-accent/55 to-card px-5 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Community</p>
          <h2 class="mt-2 text-lg font-semibold tracking-[-0.02em]">커뮤니티 둘러보기</h2>
          <p class="mt-2 text-sm leading-6 text-muted-foreground">
            관심 있는 게시판으로 이동해 전체 글을 보거나 새 이야기를 시작하세요.
          </p>
          <Button v-if="isLoggedIn && firstBoardId" class="mt-4 w-full gap-2" as-child>
            <NuxtLink :to="`/board/${firstBoardId}/write`">
              <PenLineIcon class="size-4" /> 글 작성하기
            </NuxtLink>
          </Button>
        </div>

        <nav class="max-h-[42vh] overflow-y-auto p-2" aria-label="커뮤니티 목록">
          <template v-for="group in menus" :key="group.group">
            <h3 class="px-3 pb-1 pt-3 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {{ recoverChars(group.group) }}
            </h3>
            <NuxtLink
              v-for="board in group.boards"
              :key="board.id"
              :to="`/board/${board.id}/page/1`"
              class="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/70"
            >
              <span
                class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
              >
                <component :is="iconFor(board.type)" class="size-4" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold group-hover:text-primary">
                  n/{{ board.id }}
                </span>
                <span class="mt-0.5 block truncate text-xs text-muted-foreground">
                  {{ recoverChars(board.name) }}
                </span>
              </span>
              <span class="mt-1 whitespace-nowrap text-[0.65rem] text-muted-foreground">
                피드 {{ boardPostCounts.get(board.id) || 0 }}
              </span>
            </NuxtLink>
          </template>

          <p v-if="!menus.length" class="px-3 py-7 text-center text-sm text-muted-foreground">
            등록된 게시판이 없습니다.
          </p>
        </nav>
      </section>

      <section class="rounded-2xl border border-border/75 bg-card p-5 shadow-sm">
        <div class="flex items-center gap-2 text-sm font-semibold">
          <OrbitIcon class="size-4 text-primary" /> NUBO
        </div>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">
          사진 커뮤니티, 블로그, 게시판을 하나의 플랫폼으로 구성하는 오픈소스 커뮤니티 빌더입니다.
        </p>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" class="gap-1.5" as-child>
            <a href="https://github.com/sirini/nubo" target="_blank" rel="noopener noreferrer">
              <GithubIcon class="size-3.5" /> NUBO
            </a>
          </Button>
          <Button variant="outline" size="sm" class="gap-1.5" as-child>
            <a href="https://github.com/sirini/goapi" target="_blank" rel="noopener noreferrer">
              <ServerCogIcon class="size-3.5" /> GOAPI
            </a>
          </Button>
        </div>
      </section>

      <p class="px-2 text-xs leading-5 text-muted-foreground">
        커뮤니티의 글과 미디어는 각 작성자에게 귀속됩니다.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  BookOpenIcon,
  GithubIcon,
  ImageIcon,
  MessageSquareTextIcon,
  OrbitIcon,
  PenLineIcon,
  ServerCogIcon,
  ShoppingBagIcon,
} from "lucide-vue-next"
import type { Component } from "vue"
import { BOARD, type Board } from "~/types/board"
import type { HomePostItem, HomeSidebarGroupResult } from "~/types/home"

const props = defineProps<{
  menus: HomeSidebarGroupResult[]
  posts: HomePostItem[]
  firstBoardId: string
  isLoggedIn: boolean
}>()

const icons: Partial<Record<Board, Component>> = {
  [BOARD.DEFAULT]: MessageSquareTextIcon,
  [BOARD.GALLERY]: ImageIcon,
  [BOARD.BLOG]: BookOpenIcon,
  [BOARD.TRADE]: ShoppingBagIcon,
}
const iconFor = (type: Board) => icons[type] || MessageSquareTextIcon
const boardPostCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const post of props.posts) counts.set(post.id, (counts.get(post.id) || 0) + 1)
  return counts
})
</script>
