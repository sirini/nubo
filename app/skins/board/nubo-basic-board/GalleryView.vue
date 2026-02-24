<template>
  <div class="mx-auto">
    <div class="flex flex-col lg:flex-row gap-0 overflow-hidden h-[calc(100dvh-70px)]">
      <section class="flex-1 flex items-center justify-center bg-black/20">
        <GalleryImageCarousel />

        <div v-if="!view.images.length" class="text-zinc-500">No images</div>
      </section>

      <aside class="w-full lg:w-95 flex flex-col bg-card h-full">
        <ScrollArea class="h-auto lg:h-[calc(100dvh-70px)]">
          <div class="p-4 space-y-4">
            <GalleryExif v-if="view.images[imgIdx]?.exif.make.length" />

            <ViewWriterProfile />
            <Card>
              <ViewMainContent />
            </Card>

            <div class="rounded-lg border p-4">
              <ViewCommentList />
            </div>

            <ViewWriteComment />

            <div class="flex items-center justify-between my-12">
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
import ViewCommentList from "./components/view/ViewCommentList.vue"
import ViewListButton from "./components/view/ViewListButton.vue"
import ViewMainContent from "./components/view/ViewMainContent.vue"
import ViewModifyButton from "./components/view/ViewModifyButton.vue"
import ViewWriteButton from "./components/view/ViewWriteButton.vue"
import ViewWriteComment from "./components/view/ViewWriteComment.vue"
import ViewWriterProfile from "./components/view/ViewWriterProfile.vue"

const { view, imgIdx } = useNuboViewContext()
</script>
