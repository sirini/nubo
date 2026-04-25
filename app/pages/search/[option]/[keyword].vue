<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "vue-sonner/style.css"
import { nuboHomeKey } from "~/providers/contexts/home"
import { useHomeProvider } from "~/providers/home"
import type { Search } from "~/types/board"
import { SEARCH } from "~/types/board"

const route = useRoute()
const config = useRuntimeConfig()
const home = useHomeStore()

const modules = import.meta.glob("~/skins/*/Home.vue")
const selectedSkin = getSkin(modules, config.public.skins.home, "nubo-basic-home")

const option = computed(() => route.params.option as string)
const keyword = computed(() => route.params.keyword as string)

// 하이드레이션 미스매치 방지 및 캐싱
const { data: initData } = await useAsyncData(
  `home-search-${option.value}-${keyword.value}`,
  async () => {
    home.option = (home.options[option.value] || SEARCH.TITLE) as Search
    home.keyword = keyword.value

    await home.getInitLatestPosts({ reset: true })
    return { success: true, timestamp: Date.now() }
  },
  {
    watch: [() => route.params],
  },
)

provide(nuboHomeKey, useHomeProvider())
</script>
