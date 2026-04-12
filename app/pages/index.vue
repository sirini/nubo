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

home.option = SEARCH.TITLE as Search
home.keyword = ""

await home.getInitLatestPosts({ reset: true })

provide(nuboHomeKey, useHomeProvider())
</script>
