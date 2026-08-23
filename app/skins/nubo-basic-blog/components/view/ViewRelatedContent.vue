<template>
  <section v-if="view.writerPosts.length || view.writerComments.length" class="my-8">
    <div class="mb-4 text-sm font-semibold text-muted-foreground">작성자의 다른 활동</div>
    <Card class="border-none bg-transparent p-0 shadow-none">
      <CardContent class="grid gap-4 p-0 md:grid-cols-2">
        <ViewLatestPosts :posts="view.writerPosts" />
        <ViewLatestComments :comments="view.writerComments" />
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import ViewLatestComments from "./ViewLatestComments.vue"
import ViewLatestPosts from "./ViewLatestPosts.vue"

const { view } = useNuboViewContext()
</script>
