<template>
  <component :is="selectedSkin">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { useLayoutProvider } from "~/providers/layout"
import { nuboLayoutKey } from "~/types/nubo-skin-keys"

const config = useRuntimeConfig()
const { addVisitHistory } = useHome()
const auth = useAuthStore()
const home = useHomeStore()

const selectedSkin = computed(() => {
  const skinName = config.public.defaultSkins.layout
  return defineAsyncComponent(() => import(`~/skins/layout/${skinName}/Layout.vue`))
})

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
