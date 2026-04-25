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

const { addVisitHistory } = useHome()
const auth = useAuthStore()

await Promise.all([home.getInitMenus(), auth.getInitUserInfo()])

addVisitHistory(auth.user.uid)

provide(nuboLayoutKey, useLayoutProvider())
</script>
