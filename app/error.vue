<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const modules = import.meta.glob("~/skins/*/Error.vue")
const selectedSkin = getSkin(modules, config.public.skins.error, "nubo-basic-error")
</script>
