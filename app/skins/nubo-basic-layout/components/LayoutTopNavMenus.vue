<template>
  <div class="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b">
    <div class="container mx-auto p-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="w-full md:w-auto flex justify-between md:block">
          <LayoutTopMenu />

          <div class="flex justify-center gap-2 md:hidden">
            <Button variant="outline" size="icon" @click="isShow = !isShow">
              <SearchIcon />
            </Button>
            <LayoutNotiSheet />
          </div>
        </div>

        <div class="md:block" :class="isShow ? 'w-full' : 'hidden'">
          <div class="flex items-center justify-center gap-2">
            <LayoutTopSearch />
            <div class="hidden md:block"><LayoutNotiSheet /></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SearchIcon } from "lucide-vue-next"
import LayoutTopMenu from "./LayoutTopMenu.vue"
import LayoutTopSearch from "./LayoutTopSearch.vue"
import { useNuboLayoutContext } from "~/providers/contexts/layout"
import LayoutNotiSheet from "./LayoutNotiSheet.vue"

const isShow = ref<boolean>(false)
const { isLoggedIn } = useNuboLayoutContext()
</script>
