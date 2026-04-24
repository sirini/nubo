<template>
  <div
    class="relative min-h-screen bg-background mx-auto p-4"
    :style="`max-width: ${config.width}px`"
  >
    <div
      class="fixed top-0 left-0 w-full h-0.5 bg-primary z-50 origin-left"
      id="reading-progress"
    ></div>

    <ViewBreadcrumb />
    <Card class="rounded-lg shadow-lg pt-0">
      <BlogHeader />

      <main class="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <BlogTableOfContent />

        <CardContent class="lg:col-span-9 px-0">
          <div class="nubo leading-7">
            <div v-html="sanitize(view.post.content)"></div>
          </div>
        </CardContent>
      </main>

      <CardFooter class="px-4 justify-between">
        <ViewTagBadges />
        <ViewLikeButton />
      </CardFooter>
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
import ViewRelatedContent from "./components/view/ViewRelatedContent.vue"
import ViewTagBadges from "./components/view/ViewTagBadges.vue"
import ViewWriteButton from "./components/view/ViewWriteButton.vue"
import ViewWriteComment from "./components/view/ViewWriteComment.vue"

const { view, config, updateReadingProgress, clearReadingProgress } = useNuboViewContext()
const { sanitize } = useSanitize()

onMounted(() => updateReadingProgress("reading-progress"))
onBeforeUnmount(() => clearReadingProgress())
</script>
