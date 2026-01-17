<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { toast } from "vue-sonner"
import { useAdminProvider } from "~/providers/admin"
import { nuboAdminKey } from "~/types/nubo-skin-keys"

const config = useRuntimeConfig()
const auth = useAuthStore()
const admin = useAdminStore()

const selectedSkin = computed(() => {
  const skinName = config.public.skins.admin
  admin.skin = skinName
  return defineAsyncComponent(() => import(`~/skins/admin/${skinName}/Admin.vue`))
})

onMounted(() => {
  if (!auth.isAdmin) {
    toast(`❌ 관리자만 접근 가능합니다`)
    navigateTo("/")
  }
})

provide(nuboAdminKey, useAdminProvider())
</script>
