<template>
  <topmenu-nav-menus />
  <div class="min-h-screen">
    <main class="container mx-auto flex-1 px-4 py-6 min-h-[80vh]">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useVisit } from "~/composables/useVisit"

onNuxtReady(() => {
  const { call } = useVisit()
  call(0)
})
</script>
