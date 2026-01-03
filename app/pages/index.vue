<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "vue-sonner/style.css"
import { useHomeProvider } from "~/providers/home"
import { SEARCH, type Search } from "~/types/board"
import { nuboHomeKey } from "~/types/nubo-skin-keys"

const config = useRuntimeConfig()
const home = useHomeStore()
home.option = SEARCH.TITLE as Search
home.keyword = ""

const selectedSkin = computed(() => {
  const skinName = config.public.defaultSkins.home
  return defineAsyncComponent(() => import(`~/skins/home/${skinName}/Home.vue`))
})

await home.getInitLatestPosts({ reset: true })

provide(nuboHomeKey, useHomeProvider())
</script>
