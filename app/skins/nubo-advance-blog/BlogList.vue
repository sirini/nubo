<template>
  <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
    <header
      class="flex flex-col gap-8 border-b border-border/60 pb-10 md:flex-row md:items-end md:justify-between"
    >
      <div class="max-w-2xl">
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Ideas worth sharing
        </p>
        <h1 class="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          {{ recoverChars(config.name) }}
        </h1>
        <p class="mt-5 text-base leading-8 text-muted-foreground">
          {{ recoverChars(config.info) }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button v-if="isAdmin" variant="outline" size="icon" as-child
          ><NuxtLink :to="`/admin/board/${config.id}`" aria-label="블로그 관리"
            ><SettingsIcon class="size-4" /></NuxtLink
        ></Button>
        <Button v-if="isLoggedIn" class="gap-2" as-child
          ><NuxtLink :to="`/board/${config.id}/write`"
            ><PenLineIcon class="size-4" /> 글쓰기</NuxtLink
          ></Button
        >
        <Button v-else variant="outline" class="gap-2" as-child
          ><NuxtLink :to="`/auth/login?redirect=/board/${config.id}/page/${page}`"
            ><LogInIcon class="size-4" /> 로그인</NuxtLink
          ></Button
        >
      </div>
    </header>

    <section v-if="notices.length" class="mt-8 space-y-2" aria-label="공지 글">
      <NuxtLink
        v-for="notice in notices"
        :key="notice.uid"
        :to="`/board/${config.id}/${notice.uid}`"
        class="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm hover:bg-primary/10"
        ><MegaphoneIcon class="size-4 shrink-0 text-primary" /><span class="truncate font-medium">{{
          recoverChars(notice.title)
        }}</span
        ><span class="ml-auto shrink-0 text-xs text-muted-foreground">{{
          date(notice.submitted)
        }}</span></NuxtLink
      >
    </section>

    <section
      v-if="featuredPost"
      class="grid gap-7 border-b border-border/60 py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] md:items-center md:py-14"
    >
      <NuxtLink
        :to="postUrl(featuredPost.uid)"
        class="group block overflow-hidden rounded-2xl bg-media"
      >
        <img
          v-if="featuredPost.cover"
          :src="featuredPost.cover"
          :alt="recoverChars(featuredPost.title)"
          class="aspect-16/10 h-full w-full object-cover transition duration-500 group-hover:scale-[1.015] group-hover:brightness-95"
        />
        <div
          v-else
          class="flex aspect-16/10 items-center justify-center bg-muted text-sm text-muted-foreground"
        >
          대표 이미지가 없습니다
        </div>
      </NuxtLink>
      <article>
        <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge v-if="config.useCategory && featuredPost.category.name" variant="secondary">{{
            recoverChars(featuredPost.category.name)
          }}</Badge
          ><span>{{ date(featuredPost.submitted) }}</span
          ><span>·</span><span>{{ getReadingTime(featuredPost.content) }}분 읽기</span>
        </div>
        <NuxtLink :to="postUrl(featuredPost.uid)" class="group"
          ><h2
            class="mt-5 text-3xl font-semibold leading-tight tracking-[-0.045em] transition-colors group-hover:text-primary sm:text-4xl"
          >
            {{ recoverChars(featuredPost.title) }}
          </h2></NuxtLink
        >
        <p class="mt-5 line-clamp-4 text-base leading-8 text-muted-foreground">
          {{ excerpt(featuredPost.content) }}
        </p>
        <div class="mt-7 flex items-center justify-between gap-4">
          <WriterLine :post="featuredPost" /><PostSignals :post="featuredPost" />
        </div>
      </article>
    </section>

    <section v-if="remainingPosts.length" class="divide-y divide-border/60" aria-label="글 목록">
      <article
        v-for="post in remainingPosts"
        :key="post.uid"
        class="grid gap-5 py-8 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center md:py-10"
      >
        <div class="min-w-0">
          <WriterLine :post="post" />
          <NuxtLink :to="postUrl(post.uid)" class="group block"
            ><h2
              class="mt-4 text-2xl font-semibold leading-snug tracking-[-0.035em] transition-colors group-hover:text-primary"
            >
              {{ recoverChars(post.title) }}
            </h2>
            <p class="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground">
              {{ excerpt(post.content) }}
            </p></NuxtLink
          >
          <div
            class="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"
          >
            <div class="flex items-center gap-2">
              <Badge v-if="config.useCategory && post.category.name" variant="secondary">{{
                recoverChars(post.category.name)
              }}</Badge
              ><span>{{ date(post.submitted) }}</span
              ><span>· {{ getReadingTime(post.content) }}분</span>
            </div>
            <PostSignals :post="post" />
          </div>
        </div>
        <NuxtLink
          :to="postUrl(post.uid)"
          class="order-first block overflow-hidden rounded-xl bg-media sm:order-last"
          ><img
            v-if="post.cover"
            :src="post.cover"
            :alt="recoverChars(post.title)"
            loading="lazy"
            class="aspect-16/10 h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
          />
          <div
            v-else
            class="flex aspect-16/10 items-center justify-center bg-muted text-xs text-muted-foreground"
          >
            이미지 없음
          </div></NuxtLink
        >
      </article>
    </section>

    <div
      v-if="!posts.length"
      class="mt-12 rounded-2xl border border-dashed border-border py-24 text-center text-muted-foreground"
    >
      아직 발행된 글이 없습니다.
    </div>

    <footer class="mt-12 flex flex-col items-center gap-7 border-t border-border/60 pt-8">
      <div class="flex items-center gap-3">
        <Button v-if="page > 1" variant="outline" as-child
          ><NuxtLink :to="setPagingUrl(Math.max(1, page - 1))"
            ><ChevronLeftIcon class="size-4" /> 이전</NuxtLink
          ></Button
        ><Button v-else variant="outline" disabled><ChevronLeftIcon class="size-4" /> 이전</Button
        ><span class="min-w-20 text-center text-sm text-muted-foreground"
          >{{ page }} / {{ pageCount }}</span
        ><Button v-if="page < pageCount" variant="outline" as-child
          ><NuxtLink :to="setPagingUrl(Math.min(pageCount, page + 1))"
            >다음 <ChevronRightIcon class="size-4" /></NuxtLink></Button
        ><Button v-else variant="outline" disabled>다음 <ChevronRightIcon class="size-4" /></Button>
      </div>
      <form class="flex w-full max-w-lg gap-2" @submit.prevent="searchPost">
        <select v-model="option" class="rounded-lg border border-input bg-background px-3 text-sm">
          <option :value="SEARCH.TITLE">제목</option>
          <option :value="SEARCH.CONTENT">내용</option>
          <option :value="SEARCH.WRITER">작성자</option>
          <option :value="SEARCH.TAG">태그</option></select
        ><Input
          v-model="keyword"
          type="search"
          aria-label="블로그 검색어"
          placeholder="글과 작성자를 검색하세요"
        /><Button type="submit" size="icon" :disabled="keyword.trim().length < 2" aria-label="검색"
          ><SearchIcon class="size-4"
        /></Button>
      </form>
    </footer>
  </main>
</template>

<script setup lang="ts">
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LogInIcon,
  MegaphoneIcon,
  PenLineIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-vue-next"
import { useNuboListContext } from "~/providers/contexts/list"
import { SEARCH } from "~/types/board"
import PostSignals from "./components/PostSignals.vue"
import WriterLine from "./components/WriterLine.vue"

const {
  config,
  isAdmin,
  isLoggedIn,
  keyword,
  notices,
  option,
  page,
  posts,
  searchPost,
  setPagingUrl,
  totalPostCount,
} = useNuboListContext()
const featuredPost = computed(() => posts.value.at(0))
const remainingPosts = computed(() => posts.value.slice(1))
const pageCount = computed(() =>
  Math.max(1, Math.ceil(totalPostCount.value / Math.max(1, config.value.rowCount))),
)
const postUrl = (uid: number) => `/board/${config.value.id}/${uid}`
const excerpt = (content: string) => recoverChars(stripTags(content)).replace(/\s+/g, " ").trim()
</script>
