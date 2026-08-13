<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { nuboLoginKey } from "~/providers/contexts/login"
import { useLoginProvider } from "~/providers/login"

const { settings } = useSkins()
const modules = import.meta.glob("~/skins/*/ResetPassword.vue")
const selectedSkin = getSkin(modules, () => settings.value.login, "nubo-basic-login")
provide(nuboLoginKey, useLoginProvider())
</script>
