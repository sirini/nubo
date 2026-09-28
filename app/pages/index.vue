<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "vue-sonner/style.css"
import { nuboHomeKey } from "~/providers/contexts/home"
import { useHomeProvider } from "~/providers/home"
import { SEARCH, type Search } from "~/types/board"

const { settings } = useSkins()
const home = useHomeStore()
const modules = import.meta.glob("~/skins/*/Home.vue")
const selectedSkin = getSkin(modules, () => settings.value.home, "nubo-basic-home")

home.option = SEARCH.TITLE as Search
home.keyword = ""
// SSR에서 직렬화한 피드를 hydration 도중 다시 비우거나 재요청하지 않습니다.
if (!useNuxtApp().isHydrating || !home.initialized) {
  await home.getInitLatestPosts({ reset: true })
}

provide(nuboHomeKey, useHomeProvider())
</script>
