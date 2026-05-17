<template>
  <div class="min-h-screen">
    <LayoutTopNavMenus />
    <main>
      <slot />
    </main>
    <LayoutFooter />
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import LayoutFooter from "./components/LayoutFooter.vue"
import LayoutTopNavMenus from "./components/LayoutTopNavMenus.vue"
import "./theme.css"
import { useNuboLayoutContext } from "~/providers/contexts/layout"

const { isLoggedIn, loadNotifications } = useNuboLayoutContext()

if (isLoggedIn.value) {
  await loadNotifications(10)
}
</script>
