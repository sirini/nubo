<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { nuboLoginKey } from "~/providers/contexts/login"
import { useLoginProvider } from "~/providers/login"

const route = useRoute()
const { settings } = useSkins()
const join = useJoinStore()
const modules = import.meta.glob("~/skins/*/ChangePassword.vue")
const selectedSkin = getSkin(modules, () => settings.value.login, "nubo-basic-login")

join.resetTarget = parseInt(route.params.userUid as string)
join.resetCode = route.params.code as string

provide(nuboLoginKey, useLoginProvider())
</script>
