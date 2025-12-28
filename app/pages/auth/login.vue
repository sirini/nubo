<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { useLoginProvider } from "~/providers/login"
import { nuboLoginKey } from "~/types/nubo-skin-keys"

const config = useRuntimeConfig()

const selectedSkin = computed(() => {
  const skinName = config.public.defaultSkins.login
  return defineAsyncComponent(() => import(`../../skins/login/${skinName}/Login.vue`))
})

provide(nuboLoginKey, useLoginProvider())
</script>
