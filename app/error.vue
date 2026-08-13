<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const { settings, loadSettings } = useSkins()
await loadSettings()
const modules = import.meta.glob("~/skins/*/Error.vue")
const selectedSkin = getSkin(modules, () => settings.value.error, "nubo-basic-error")
</script>
