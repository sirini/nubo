<template>
  <section class="container mx-auto py-4">
    <div class="mx-auto" :class="`max-w-[${config.width}px]`">
      <ViewBreadcrumb />

      <Card
        class="rounded-lg overflow-hidden shadow-lg pt-0 mb-4"
        :class="`max-w-[${config.width}px]`"
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

const { view, config } = useNuboViewContext()
</script>
