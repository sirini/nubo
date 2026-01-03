<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "vue-sonner/style.css"
import { useHomeSearchProvider } from "~/providers/home-search"
import { nuboHomeKey } from "~/types/nubo-skin-keys"

const config = useRuntimeConfig()
const home = useHomeStore()

const selectedSkin = computed(() => {
  const skinName = config.public.skins.home
  return defineAsyncComponent(() => import(`~/skins/home/${skinName}/Home.vue`))
})

await home.getInitLatestPosts({ reset: true })

provide(nuboHomeKey, useHomeSearchProvider())
</script>
