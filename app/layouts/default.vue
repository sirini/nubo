<template>
  <component :is="selectedSkin">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { nuboLayoutKey } from "~/providers/contexts/layout"
import { useLayoutProvider } from "~/providers/layout"

const home = useHomeStore()
const config = useRuntimeConfig()
const modules = import.meta.glob("~/skins/*/Layout.vue")
const selectedSkin = getSkin(modules, config.public.skins.layout, "nubo-basic-layout")

await home.getInitMenus()

provide(nuboLayoutKey, useLayoutProvider())
</script>
