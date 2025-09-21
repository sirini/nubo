<template>
  <section class="container mx-auto py-4">
    <div>
      <div v-if="pending">Loading ...</div>
      <div v-else-if="view" class="mx-auto" :style="`max-width: ${view.config.width}px`">
        <BoardViewBreadcrumb :config="view.config" />
        <Card
          class="rounded-lg overflow-hidden shadow-lg pt-0"
          :style="`max-width: ${view.config.width}px`"
        >
          <img
            v-if="view.images.length > 0"
            :src="view.images[0].thumbnail.large"
            alt="cover image"
            class="w-full object-cover"
          />
          <CardHeader class="px-3" :class="view.post.cover ? '' : 'pt-6'">
            <CardTitle class="line-clamp-1 mb-2 text-2xl font-title px-1">{{
              view.post.title
            }}</CardTitle>
            <CardDescription class="inline-flex items-center px-1 font-code">
              <Heart
                :class="view.post.liked ? 'text-red-200 fill-current' : ''"
                class="w-3 h-3 mr-2"
              />
              {{ view.post.like }}
              <MessageCircle class="w-3 h-3 ml-4 mr-2" />
              {{ showReadableNumber(view.post.comment) }}
              <Eye class="w-3 h-3 ml-4 mr-2" />
              {{ showReadableNumber(view.post.hit) }}
              <span class="flex-1"></span>
              {{ showDateOnly(view.post.submitted) }}
            </CardDescription>
          </CardHeader>
          <CardContent class="leading-7 px-4 nubo">
            <div v-html="view.post.content"></div>
          </CardContent>
          <CardFooter class="px-4">
            <Badge
              v-for="(tag, index) in view.tags"
              :key="index"
              variant="secondary"
              class="mt-2 mr-2"
            >
              <Hash />
              {{ tag.name }}</Badge
            >
          </CardFooter>

          <div v-if="view.post.writer.signature.length > 0">
            <hr />
            <div class="text-secondary text-sm pt-3 px-4">
              {{ stripHtmlTags(view.post.writer.signature) }}
            </div>
          </div>
        </Card>

        <BoardViewWriteComment class="mt-4" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBoardViewStore } from "#imports"
import { Eye, Hash, Heart, MessageCircle } from "lucide-vue-next"
import "~/assets/css/editor.scss"
import { showDateOnly, showReadableNumber, stripHtmlTags } from "~/lib/utils"

const route = useRoute()
const boardView = useBoardViewStore()
const { view, pending } = storeToRefs(boardView)

await boardView.fetchView(route.params.id as string, parseInt(route.params.postUid as string, 10))

watch(
  () => route.params,
  async (newParams) => {
    await boardView.fetchView(newParams.id as string, parseInt(newParams.postUid as string, 10))
  },
)
</script>
