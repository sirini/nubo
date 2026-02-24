<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { useLoginProvider } from "~/providers/login"
import { nuboLoginKey } from "~/providers/contexts/login"

const route = useRoute()
const config = useRuntimeConfig()
const join = useJoinStore()
const modules = import.meta.glob("~/skins/login/*/ChangePassword.vue")
const selectedSkin = getSkin(modules, config.public.skins.login, "nubo-basic-login")

join.resetTarget = parseInt(route.params.userUid as string)
join.resetCode = route.params.code as string

provide(nuboLoginKey, useLoginProvider())
</script>
