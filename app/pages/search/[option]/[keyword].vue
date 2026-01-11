<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "vue-sonner/style.css"
import { useHomeProvider } from "~/providers/home"
import type { Search } from "~/types/board"
import { SEARCH } from "~/types/board"
import { nuboHomeKey } from "~/types/nubo-skin-keys"

const route = useRoute()
const config = useRuntimeConfig()
const home = useHomeStore()

home.option = (home.options[route.params.option as string] || SEARCH.TITLE) as Search
home.keyword = route.params.keyword as string

const selectedSkin = computed(() => {
  const skinName = config.public.skins.home
  return defineAsyncComponent(() => import(`~/skins/home/${skinName}/Home.vue`))
})

await home.getInitLatestPosts({ reset: true })

provide(nuboHomeKey, useHomeProvider())
</script>
