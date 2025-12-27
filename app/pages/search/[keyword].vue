<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "vue-sonner/style.css"
import { nuboHomeKey } from "~/types/nubo-skin-keys"

const config = useRuntimeConfig()
const home = useHomeStore()

const selectedSkin = computed(() => {
  const skinName = config.public.defaultSkins.home
  return defineAsyncComponent(() => import(`../../skins/home/${skinName}/Home.vue`))
})

await home.getInitLatestPosts({ reset: true })

provide(nuboHomeKey, {
  pending: computed(() => home.pending),
  posts: computed(() => home.posts),
  loadMorePosts: async () => {
    await home.loadMore()
  },
})
</script>
