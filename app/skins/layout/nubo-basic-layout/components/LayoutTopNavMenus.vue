<template>
  <div class="sticky top-0 z-50 backdrop-blur-md bg-background/70 py-4 border-b">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="w-full md:w-auto flex justify-between md:block">
          <LayoutTopMenu />
        </div>

        <div class="w-full md:w-auto">
          <LayoutTopSearch class="w-full" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LayoutTopMenu from "./LayoutTopMenu.vue"
import LayoutTopSearch from "./LayoutTopSearch.vue"
</script>
