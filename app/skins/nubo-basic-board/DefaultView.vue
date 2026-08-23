<template>
  <section class="mx-auto px-4 py-8 sm:px-6 sm:py-12">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <ViewBreadcrumb />

      <article class="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
        <ViewImageCarousel v-if="view.images.length > 0" />
        <ViewMainContent />
        <ViewAttachmentList v-if="view.files.length > 0" />
      </article>

      <ViewWriterProfile class="mt-5 rounded-2xl border border-border/70 bg-card/55 p-5" />
      <ViewRelatedContent />
      <section class="mt-8 rounded-2xl border border-border/70 bg-card/55 p-4 sm:p-6">
        <h2 class="mb-5 text-lg font-semibold">댓글 {{ num(view.post.comment) }}</h2>
        <ViewWriteComment />
        <ViewCommentList class="mt-8" />
      </section>

      <div class="my-10 flex items-center justify-between gap-3">
        <ViewListButton />

        <div class="inline-flex items-center gap-3">
          <ViewModifyButton />
          <ViewWriteButton />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import ViewAttachmentList from "./components/view/ViewAttachmentList.vue"
import ViewBreadcrumb from "./components/view/ViewBreadcrumb.vue"
import ViewCommentList from "./components/view/ViewCommentList.vue"
import ViewImageCarousel from "./components/view/ViewImageCarousel.vue"
import ViewListButton from "./components/view/ViewListButton.vue"
import ViewMainContent from "./components/view/ViewMainContent.vue"
import ViewModifyButton from "./components/view/ViewModifyButton.vue"
import ViewRelatedContent from "./components/view/ViewRelatedContent.vue"
import ViewWriteButton from "./components/view/ViewWriteButton.vue"
import ViewWriteComment from "./components/view/ViewWriteComment.vue"
import ViewWriterProfile from "./components/view/ViewWriterProfile.vue"

// view에는 현재 글·작성자·이미지·첨부가, config에는 게시판 이름·폭·권한 설정이 들어 있습니다.
const { view, config } = useNuboViewContext()
</script>
