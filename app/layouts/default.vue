<template>
  <component :is="selectedSkin">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { nuboLayoutKey } from "~/providers/contexts/layout"
import { useLayoutProvider } from "~/providers/layout"

const config = useRuntimeConfig()
const { addVisitHistory } = useHome()
const auth = useAuthStore()
const home = useHomeStore()
const modules = import.meta.glob("~/skins/*/Layout.vue")
const selectedSkin = getSkin(modules, config.public.skins.layout, "nubo-basic-layout")

await home.getInitMenus()

// 로그인 여부 확인해서 업뎃해놓기
await useAsyncData(
  "init-auth",
  async () => {
    if (!auth.isLoggedIn) {
      await auth.getInitUserInfo()
    }
    return auth.isLoggedIn
  },
  {
    watch: [],
  },
)

onNuxtReady(() => {
  addVisitHistory()
})

provide(nuboLayoutKey, useLayoutProvider())
</script>
