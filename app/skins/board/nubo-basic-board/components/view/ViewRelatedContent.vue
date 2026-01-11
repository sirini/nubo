<template>
  <section class="my-6">
    <Card class="border-none p-0 shadow-none">
      <CardContent class="grid gap-4 md:grid-cols-4 p-0">
        <ViewLatestPosts :posts="view.writerPosts" />
        <ViewLatestComments :comments="view.writerComments" />
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/types/nubo-skin-keys"
import ViewLatestComments from "./ViewLatestComments.vue"
import ViewLatestPosts from "./ViewLatestPosts.vue"

const { view } = useNuboViewContext()
</script>
