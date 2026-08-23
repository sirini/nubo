<template>
  <div class="relative mx-auto min-h-screen px-4 py-8 sm:px-6 sm:py-12" :style="`max-width: ${config.width}px`">
    <div
      id="reading-progress"
      class="fixed left-0 top-0 z-50 h-0.5 w-full origin-left bg-primary"
    ></div>

    <ViewBreadcrumb />
    <article class="rounded-2xl border border-border/70 bg-card/65">
      <BlogHeader />

      <main class="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-12">
        <BlogTableOfContent />

        <div class="lg:col-span-9">
          <div class="nubo text-[1rem] leading-8 sm:text-[1.04rem]">
            <ViewPostContent :content="view.post.content" />
          </div>
        </div>
      </main>

      <footer class="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 px-5 py-6 sm:px-8">
        <ViewTagBadges />
        <ViewLikeButton />
      </footer>
    </article>

    <ViewRelatedContent />
    <section class="mt-8 rounded-2xl border border-border/70 bg-card/55 p-4 sm:p-6">
      <h2 class="mb-5 text-lg font-semibold">댓글 {{ num(view.post.comment) }}</h2>
      <ViewWriteComment />
      <ViewCommentList class="mt-8" />
    </section>

    <div class="my-10 flex items-center justify-between gap-3">
      <ViewListButton />

      <div class="inline-flex gap-3 items-center">
        <ViewModifyButton />
        <ViewWriteButton />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import BlogHeader from "./components/view/BlogHeader.vue"
import BlogTableOfContent from "./components/view/BlogTableOfContent.vue"
import ViewBreadcrumb from "./components/view/ViewBreadcrumb.vue"
import ViewCommentList from "./components/view/ViewCommentList.vue"
import ViewLikeButton from "./components/view/ViewLikeButton.vue"
import ViewListButton from "./components/view/ViewListButton.vue"
import ViewModifyButton from "./components/view/ViewModifyButton.vue"
import ViewPostContent from "./components/view/ViewPostContent.vue"
import ViewRelatedContent from "./components/view/ViewRelatedContent.vue"
import ViewTagBadges from "./components/view/ViewTagBadges.vue"
import ViewWriteButton from "./components/view/ViewWriteButton.vue"
import ViewWriteComment from "./components/view/ViewWriteComment.vue"

// view/config는 현재 글과 게시판 설정입니다. 두 함수는 scroll listener의 등록과 해제를 한 쌍으로 맡습니다.
const { view, config, updateReadingProgress, clearReadingProgress } = useNuboViewContext()

onMounted(() => updateReadingProgress("reading-progress"))
onBeforeUnmount(() => clearReadingProgress())
</script>
