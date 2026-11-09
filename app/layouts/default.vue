<template>
  <div class="min-h-screen flex flex-col">
    <component :is="selectedSkin" class="flex-1">
      <slot></slot>
    </component>
    <LegalFooter v-if="!homeHasPolicyLinks" />
    <UserAchievementCelebration />
  </div>
</template>

<script setup lang="ts">
import LegalFooter from "~/components/legal/LegalFooter.vue"
import { nuboLayoutKey } from "~/providers/contexts/layout"
import { useLayoutProvider } from "~/providers/layout"

const route = useRoute()
const home = useHomeStore()
const { settings, loadSettings } = useSkins()
await loadSettings()
const homeHasPolicyLinks = computed(() => route.path === "/" && ["nubo-basic-home", "nubo-advance-home"].includes(settings.value.home))

const modules = import.meta.glob("~/skins/*/Layout.vue")
const selectedSkin = getSkin(modules, () => settings.value.layout, "nubo-basic-layout")

const { addVisitHistory } = useHome()
const auth = useAuthStore()

await Promise.all([auth.isLoggedIn ? Promise.resolve() : auth.getInitUserInfo(), home.getInitMenus()])
addVisitHistory(auth.user.uid)

provide(nuboLayoutKey, useLayoutProvider())
</script>
