<template>
  <section class="container mx-auto py-4">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <ViewBreadcrumb />

      <Card
        class="rounded-lg overflow-hidden shadow-lg pt-0 mb-4"
        :style="`max-width: ${config.width}px`"
      >
        <ViewImageCarousel v-if="view.images.length > 0" />
        <ViewAttachmentList />
        <ViewMainContent />
      </Card>

      <ViewRelatedContent />
      <ViewWriteComment />
      <ViewCommentList />

      <div class="flex items-center justify-between my-12">
        <ViewListButton />

        <div class="inline-flex gap-3 items-center">
          <ViewModifyButton />
          <ViewWriteButton />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/types/nubo-skin-keys"
import ViewAttachmentList from "./components/ViewAttachmentList.vue"
import ViewBreadcrumb from "./components/ViewBreadcrumb.vue"
import ViewCommentList from "./components/ViewCommentList.vue"
import ViewImageCarousel from "./components/ViewImageCarousel.vue"
import ViewListButton from "./components/ViewListButton.vue"
import ViewMainContent from "./components/ViewMainContent.vue"
import ViewModifyButton from "./components/ViewModifyButton.vue"
import ViewRelatedContent from "./components/ViewRelatedContent.vue"
import ViewWriteButton from "./components/ViewWriteButton.vue"
import ViewWriteComment from "./components/ViewWriteComment.vue"

const { view, config } = useNuboViewContext()
</script>
