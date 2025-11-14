<template>
  <top-nav-menus />
  <div class="min-h-screen">
    <main class="container mx-auto flex-1 px-4 py-6 min-h-[80vh]">
      <slot />
    </main>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { Toaster } from "vue-sonner"

const { addVisitHistory } = useHome()
const auth = useAuthStore()

// 쿠키에 액세스 토큰이 있다면 로그인 처리해주기
await useAsyncData(
  "init-auth",
  async () => {
    if (import.meta.server) {
      await auth.loadOAuthUserInfo()
      return auth.isLoggedIn
    }
  },
  {
    watch: [],
  },
)

onNuxtReady(() => {
  addVisitHistory()
})
</script>
