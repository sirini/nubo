<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const { settings } = useSkins()
const modules = import.meta.glob("~/skins/*/Privacy.vue")
const selectedSkin = getSkin(modules, () => settings.value.privacy, "nubo-basic-privacy")
</script>
