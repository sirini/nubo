<template>
  <div class="min-h-screen">
    <LayoutTopNavMenus />
    <main class="container mx-auto flex-1 px-4 py-6 min-h-[80vh]">
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
</script>
