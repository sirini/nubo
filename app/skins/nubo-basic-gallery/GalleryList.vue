<template>
  <section class="mx-auto px-4 py-8 sm:px-6 sm:py-12">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <GalleryHeader />

      <div class="columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3">
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

// config.width는 관리자가 지정한 갤러리의 최대 콘텐츠 폭입니다.
const { config } = useNuboListContext()
</script>
