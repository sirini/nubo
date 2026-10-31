<template>
  <div v-if="checking" class="container mx-auto p-8">관리자 권한을 확인하고 있습니다.</div>
  <div v-else-if="!auth.isAdmin" class="container mx-auto p-8" role="alert">
    <h1 class="text-xl font-semibold">관리자 화면에 접근할 수 없습니다</h1>
    <p class="mt-2">관리자 계정으로 로그인해야 합니다.</p>
    <div class="mt-4 flex gap-4">
      <NuxtLink v-if="!auth.isLoggedIn" :to="{ path: '/auth/login', query: { redirect: route.fullPath } }" class="text-primary underline">로그인</NuxtLink>
      <NuxtLink to="/" class="text-primary underline">첫 화면으로</NuxtLink>
    </div>
  </div>
  <component :is="selectedSkin" v-else />
</template>

<script setup lang="ts">
import { useAdminProvider } from "~/providers/admin"
import { nuboAdminKey } from "~/providers/contexts/admin"
import { adminMenuForPath } from "~/utils/adminRoutes"

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const admin = useAdminStore()
const checking = ref(true)
const { settings } = useSkins()
const modules = import.meta.glob("~/skins/*/Admin.vue")
const selectedSkin = getSkin(modules, () => settings.value.admin, "nubo-basic-admin")

watch(() => router.currentRoute.value.path, (path) => {
  const menu = adminMenuForPath(path)
  if (menu) admin.openMenu(menu)
}, { immediate: true })

onMounted(async () => {
  if (!auth.isLoggedIn) await auth.getInitUserInfo()
  checking.value = false
})

provide(nuboAdminKey, useAdminProvider())
</script>
