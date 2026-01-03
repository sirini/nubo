<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const auth = useAuthStore()

const selectedSkin = computed(() => {
  const skinName = config.public.skins.login
  return defineAsyncComponent(() => import(`~/skins/login/${skinName}/Logout.vue`))
})

await callOnce(async () => {
  await auth.logout()
})
</script>
