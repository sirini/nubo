<template>
  <header class="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div class="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3 md:flex-nowrap">
        <div class="flex min-w-0 flex-1 items-center justify-between md:flex-none">
          <LayoutTopMenu />

          <div class="flex items-center gap-2 md:hidden">
            <Button variant="outline" size="icon" @click="isShow = !isShow">
              <SearchIcon />
            </Button>
            <LayoutThemeMenu />
            <LayoutNotiSheet />
          </div>
        </div>

        <div class="w-full md:block md:w-auto" :class="isShow ? 'block' : 'hidden'">
          <div class="flex items-center justify-end gap-2">
            <LayoutTopSearch />
            <div class="hidden items-center gap-2 md:flex">
              <LayoutThemeMenu />
              <LayoutNotiSheet />
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { SearchIcon } from "lucide-vue-next"
import LayoutTopMenu from "./LayoutTopMenu.vue"
import LayoutTopSearch from "./LayoutTopSearch.vue"
import LayoutNotiSheet from "./LayoutNotiSheet.vue"
import LayoutThemeMenu from "./LayoutThemeMenu.vue"

const isShow = ref<boolean>(false)
</script>
