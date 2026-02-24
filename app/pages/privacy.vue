<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const modules = import.meta.glob("~/skins/privacy/*/Privacy.vue")
const selectedSkin = getSkin(modules, config.public.skins.privacy, "nubo-basic-privacy")
</script>
