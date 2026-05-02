<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { toast } from "vue-sonner"
import { useAdminProvider } from "~/providers/admin"
import { nuboAdminKey } from "~/providers/contexts/admin"

const config = useRuntimeConfig()
const auth = useAuthStore()
const admin = useAdminStore()
const modules = import.meta.glob("~/skins/*/Admin.vue")
const selectedSkin = getSkin(modules, config.public.skins.admin, "nubo-basic-admin")

onMounted(() => {
  if (!auth.isAdmin) {
    toast(`❌ 관리자만 접근 가능합니다`)
    navigateTo("/")
  }

  admin.openMenu("Board")
})

provide(nuboAdminKey, useAdminProvider())
</script>
