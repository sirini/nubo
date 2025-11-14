<template>
  <NuxtLink href="/auth/login" v-if="!auth.isLoggedIn">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child> <LogInIcon class="w-6 h-6" /> </TooltipTrigger>
        <TooltipContent class="text-foreground"> 로그인 페이지로 이동합니다 </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </NuxtLink>

  <NuxtLink href="/auth/logout" v-else>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <LogOutIcon class="w-6 h-6" />
        </TooltipTrigger>
        <TooltipContent class="text-foreground"> 로그아웃 합니다 </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </NuxtLink>
</template>

<script setup lang="ts">
import { LogInIcon, LogOutIcon } from "lucide-vue-next"

const auth = useAuthStore()
</script>
