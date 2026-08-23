<template>
  <div class="mx-auto bg-background">
    <div class="grid min-h-[calc(100dvh-65px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_25rem]">
      <section class="relative flex min-h-[55vh] items-center justify-center bg-media lg:min-h-[calc(100dvh-65px)]">
        <GalleryImageCarousel />
      </section>

      <aside class="border-l border-border/70 bg-background lg:max-h-[calc(100dvh-65px)]">
        <ScrollArea class="h-full">
          <div class="space-y-5 p-4 sm:p-6">
            <ViewBreadcrumb />
            <div class="overflow-hidden rounded-2xl border border-border/70 bg-card/65">
              <ViewMainContent />
            </div>
            <GalleryExif v-if="view.images[imgIdx]?.exif.make.length" />
            <ViewWriterProfile class="rounded-2xl border border-border/70 bg-card/55 p-4" />

            <section class="rounded-2xl border border-border/70 bg-card/55 p-4">
              <h2 class="mb-4 text-sm font-semibold">댓글 {{ num(view.post.comment) }}</h2>
              <ViewWriteComment />
              <ViewCommentList />
            </section>

            <div class="flex items-center justify-between gap-3 py-5">
              <ViewListButton />

              <div class="inline-flex gap-3 items-center">
                <ViewModifyButton />
                <ViewWriteButton />
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import GalleryExif from "./components/view/GalleryExif.vue"
import GalleryImageCarousel from "./components/view/GalleryImageCarousel.vue"
import ViewCommentList from "../nubo-basic-board/components/view/ViewCommentList.vue"
import ViewBreadcrumb from "../nubo-basic-board/components/view/ViewBreadcrumb.vue"
import ViewListButton from "../nubo-basic-board/components/view/ViewListButton.vue"
import ViewMainContent from "../nubo-basic-board/components/view/ViewMainContent.vue"
import ViewModifyButton from "../nubo-basic-board/components/view/ViewModifyButton.vue"
import ViewWriteButton from "../nubo-basic-board/components/view/ViewWriteButton.vue"
import ViewWriteComment from "../nubo-basic-board/components/view/ViewWriteComment.vue"
import ViewWriterProfile from "../nubo-basic-board/components/view/ViewWriterProfile.vue"

// view.images는 전체 이미지와 EXIF를, 쓰기 가능한 imgIdx는 carousel의 현재 위치를 제공합니다.
const { view, imgIdx } = useNuboViewContext()
</script>
