<template>
  <div class="min-h-screen bg-background">
    <LayoutTopNavMenus />
    <main>
      <slot></slot>
    </main>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import LayoutTopNavMenus from "./components/LayoutTopNavMenus.vue"
import "./theme.css"
import { useNuboLayoutContext } from "~/providers/contexts/layout"

const { isLoggedIn, loadNotifications } = useNuboLayoutContext()

defineOptions({ name: "NuboBasicLayout" })

if (isLoggedIn.value) {
  await loadNotifications(10)
}

watch(isLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await loadNotifications(10)
  } else {
    useHomeStore().clearNotifications()
  }
})
</script>
