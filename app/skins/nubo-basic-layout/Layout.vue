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
</script>
