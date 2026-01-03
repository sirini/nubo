<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { useLoginProvider } from "~/providers/login"
import { nuboLoginKey } from "~/types/nubo-skin-keys"

const route = useRoute()
const config = useRuntimeConfig()
const join = useJoinStore()
join.resetTarget = parseInt(route.params.userUid as string)
join.resetCode = route.params.code as string

const selectedSkin = computed(() => {
  const skinName = config.public.skins.login
  return defineAsyncComponent(() => import(`~/skins/login/${skinName}/ChangePassword.vue`))
})

provide(nuboLoginKey, useLoginProvider())
</script>
