<template>
  <top-nav-menus />
  <div class="min-h-screen">
    <main class="container mx-auto flex-1 px-4 py-6 min-h-[80vh]">
      <slot />
    </main>
    <BottomFooter />
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { Toaster } from "vue-sonner"

const { addVisitHistory } = useHome()
const auth = useAuthStore()

// 로그인 여부 확인해서 업뎃해놓기
await useAsyncData(
  "init-auth",
  async () => {
    if (!auth.isLoggedIn) {
      await auth.loadUserInfo()
    }
    return auth.isLoggedIn
  },
  {
    watch: [],
  },
)

onNuxtReady(() => {
  addVisitHistory()
})
</script>
