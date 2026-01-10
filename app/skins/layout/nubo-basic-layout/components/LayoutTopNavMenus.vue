<template>
  <div class="sticky top-0 z-50 backdrop-blur-md bg-background/70 py-4 border-b">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="w-full md:w-auto flex justify-between md:block">
          <LayoutTopMenu />

          <Button variant="outline" size="icon" class="md:hidden" @click="isShow = !isShow">
            <SearchIcon />
          </Button>
        </div>

        <div class="md:block" :class="isShow ? 'block w-full md:max-w-80' : 'hidden'">
          <LayoutTopSearch />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SearchIcon } from "lucide-vue-next"
import LayoutTopMenu from "./LayoutTopMenu.vue"
import LayoutTopSearch from "./LayoutTopSearch.vue"

const isShow = ref<boolean>(false)
</script>
