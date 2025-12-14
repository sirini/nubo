<template>
  <section class="container mx-auto py-4">
    <div v-if="board.pending">Loading ...</div>
    <div v-else-if="board.view" class="mx-auto" :style="`max-width: ${board.view.config.width}px`">
      <ViewBreadcrumb :config="board.view.config" />
      <Card
        class="rounded-lg overflow-hidden shadow-lg pt-0 mb-4"
        :style="`max-width: ${board.view.config.width}px`"
      >
        <ViewImageCarousel :images="board.view.images" v-if="board.view.images.length > 0" />
        <ViewAttachmentList />
        <ViewMainContent />
      </Card>
      <ViewRelatedContent :view="board.view" />

      <ViewWriteComment :config="board.view.config" />
      <ViewCommentList :view="board.view" />

      <div class="flex items-center justify-between my-12">
        <ViewListButton :board-id="boardId" />

        <div class="inline-flex gap-3 items-center">
          <ViewModifyButton :board-id="boardId" :post-uid="postUid" />
          <ViewWriteButton :board-id="boardId" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import "~/assets/css/editor.scss"

const route = useRoute()
const board = useBoardStore()
const boardId = route.params.id as string
const postUid = parseInt(route.params.postUid as string, 10)

await board.getInitView(boardId, postUid)

watch(
  () => route.params,
  async (newParams) => {
    await board.getInitView(newParams.id as string, parseInt(newParams.postUid as string, 10))
  },
)
</script>
