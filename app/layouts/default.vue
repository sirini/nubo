<template>
  <component :is="selectedSkin">
    <slot ></slot>
  </component>
</template>

<script setup lang="ts">
import { nuboLayoutKey } from "~/providers/contexts/layout"
import { useLayoutProvider } from "~/providers/layout"

const home = useHomeStore()
const { settings, loadSettings } = useSkins()
await loadSettings()

const modules = import.meta.glob("~/skins/*/Layout.vue")
const selectedSkin = getSkin(modules, () => settings.value.layout, "nubo-basic-layout")

const { addVisitHistory } = useHome()
const auth = useAuthStore()

await Promise.all([auth.getInitUserInfo(), home.getInitMenus()])
addVisitHistory(auth.user.uid)

provide(nuboLayoutKey, useLayoutProvider())
</script>
