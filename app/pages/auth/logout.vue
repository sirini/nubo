<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
const { settings } = useSkins()
const auth = useAuthStore()
const modules = import.meta.glob("~/skins/*/Logout.vue")
const selectedSkin = getSkin(modules, () => settings.value.login, "nubo-basic-login")

await callOnce(async () => {
  await auth.logout()
})
</script>
