<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const auth = useAuthStore()
const modules = import.meta.glob("~/skins/login/*/Logout.vue")
const selectedSkin = getSkin(modules, config.public.skins.login, "nubo-basic-login")

await callOnce(async () => {
  await auth.logout()
})
</script>
