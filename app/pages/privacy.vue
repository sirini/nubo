<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const selectedSkin = computed(() => {
  const skinName = config.public.defaultSkins.privacy
  return defineAsyncComponent(() => import(`~/skins/privacy/${skinName}/Privacy.vue`))
})
</script>
