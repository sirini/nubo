<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const selectedSkin = computed(() => {
  const skinName = config.public.skins.error
  return defineAsyncComponent(() => import(`./skins/error/${skinName}/Error.vue`))
})
</script>
