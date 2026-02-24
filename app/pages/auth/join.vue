<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { useLoginProvider } from "~/providers/login"
import { nuboLoginKey } from "~/providers/contexts/login"
const config = useRuntimeConfig()
const modules = import.meta.glob("~/skins/login/*/Join.vue")
const selectedSkin = getSkin(modules, config.public.skins.login, "nubo-basic-login")

provide(nuboLoginKey, useLoginProvider())
</script>
