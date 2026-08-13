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
const { settings } = useSkins()
const home = useHomeStore()

const modules = import.meta.glob("~/skins/*/Home.vue")
const selectedSkin = getSkin(modules, () => settings.value.home, "nubo-basic-home")

const option = computed(() => route.params.option as string)
const keyword = computed(() => route.params.keyword as string)

home.option = (home.options[option.value] || SEARCH.TITLE) as Search
home.keyword = keyword.value

await home.getInitLatestPosts({ reset: true })

provide(nuboHomeKey, useHomeProvider())
</script>
