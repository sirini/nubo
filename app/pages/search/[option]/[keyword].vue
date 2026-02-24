<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import "vue-sonner/style.css"
import { useHomeProvider } from "~/providers/home"
import type { Search } from "~/types/board"
import { SEARCH } from "~/types/board"
import { nuboHomeKey } from "~/providers/contexts/home"

const route = useRoute()
const config = useRuntimeConfig()
const home = useHomeStore()
const modules = import.meta.glob("~/skins/home/*/Home.vue")
const selectedSkin = getSkin(modules, config.public.skins.home, "nubo-basic-home")

home.option = (home.options[route.params.option as string] || SEARCH.TITLE) as Search
home.keyword = route.params.keyword as string

await home.getInitLatestPosts({ reset: true })

provide(nuboHomeKey, useHomeProvider())
</script>
