<template>
  <section class="container mx-auto py-6">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <GalleryHeader />

      <div class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        <GalleryPostCol />
      </div>

      <ListFooter />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useNuboListContext } from "~/providers/contexts/list"
import GalleryHeader from "./components/list/GalleryHeader.vue"
import GalleryPostCol from "./components/list/GalleryPostCol.vue"
import ListFooter from "./components/list/ListFooter.vue"

const { config } = useNuboListContext()
</script>
