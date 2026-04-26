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

const { data: initData } = await useAsyncData("init-user", async () => {
  await Promise.all([auth.getInitUserInfo(), home.getInitMenus()])
  return { success: true, timestamp: Date.now() }
})

addVisitHistory(auth.user.uid)

provide(nuboLayoutKey, useLayoutProvider())
</script>
