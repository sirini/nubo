<template>
  <div class="flex items-center gap-2">
    <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg mr-2">
      <Squirrel class="w-5 h-5" />
      <span class="hidden sm:inline">{{ config.public.title }}</span>
    </NuxtLink>

    <template v-if="menus">
      <DropdownMenu v-for="(menu, index) in menus.result" :key="index">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="font-bold text-md">{{ menu.group }}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuItem v-for="(board, idx) in menu.boards" :key="idx" as-child>
            <NuxtLink :to="`/board/${board.id}`" class="cursor-pointer">
              <div class="font-semibold">{{ board.name }}</div>
            </NuxtLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </div>
</template>

<script setup lang="ts">
// Shadcn-vue 컴포넌트 import
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Squirrel } from "lucide-vue-next"

// 기존 로직 import
import { useRuntimeConfig } from "#app"
import { useHomeMenus } from "~/composables/home/useHomeMenus"

const config = useRuntimeConfig()
const { menus } = await useHomeMenus()

// 테마 변경 로직
const colorMode = useColorMode()
const setColorTheme = (theme: "light" | "dark" | "system") => {
  colorMode.preference = theme
}
</script>
