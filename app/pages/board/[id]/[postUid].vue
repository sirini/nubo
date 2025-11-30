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

        <CardHeader class="px-3">
          <CardTitle class="line-clamp-1 my-2 text-2xl font-title px-1">{{
            board.view.post.title
          }}</CardTitle>
          <CardDescription class="inline-flex items-center px-1 font-code">
            <ViewStatusLine />
          </CardDescription>
        </CardHeader>
        <CardContent class="leading-7 px-4 nubo">
          <div v-html="board.view.post.content"></div>
        </CardContent>
        <CardFooter class="px-4 justify-between">
          <ViewTagBadges />
          <ViewLikeButton />
        </CardFooter>

        <div v-if="board.view.post.writer.signature.length > 0">
          <hr />
          <div class="text-secondary text-sm pt-3 px-4">
            {{ stripTags(board.view.post.writer.signature) }}
          </div>
        </div>
      </Card>

      <ViewWriteComment :config="board.view.config" />

      <div class="flex items-center justify-between mt-6">
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
import { stripTags } from "~/lib/utils"

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
