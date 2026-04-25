<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "vue-sonner/style.css"
import { nuboHomeKey } from "~/providers/contexts/home"
import { useHomeProvider } from "~/providers/home"
import { SEARCH, type Search } from "~/types/board"

const config = useRuntimeConfig()
const home = useHomeStore()
const modules = import.meta.glob("~/skins/*/Home.vue")
const selectedSkin = getSkin(modules, config.public.skins.home, "nubo-basic-home")

// 하이드레이션 미스매치 방지 및 캐싱
const { data: initData } = await useAsyncData(`home`, async () => {
  home.option = SEARCH.TITLE as Search
  home.keyword = ""
  await home.getInitLatestPosts({ reset: true })

  return { success: true, timestamp: Date.now() }
})

provide(nuboHomeKey, useHomeProvider())
</script>
