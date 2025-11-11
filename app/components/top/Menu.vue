<template>
  <div class="flex items-center gap-2">
    <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg mr-2">
      <Squirrel class="w-5 h-5" />
      <span class="hidden sm:inline">{{ config.public.title }}</span>
    </NuxtLink>

    <template v-if="data">
      <DropdownMenu
        v-for="(menu, index) in data.result"
        :key="index"
        v-model:open="home.openMenus[menu.group]"
      >
        <DropdownMenuTrigger as-child @mouseenter="home.handleMenuEnter(menu.group)">
          <Button variant="ghost" class="font-bold text-md">{{ menu.group }}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <div @mouseleave="home.handleMenuLeave(menu.group)">
            <DropdownMenuItem v-for="(board, idx) in menu.boards" :key="idx" as-child>
              <NuxtLink :to="`/board/${board.id}`" class="cursor-pointer">
                <div class="font-semibold">{{ board.name }}</div>
              </NuxtLink>
              <hr v-if="idx + 1 !== menu.boards.length" />
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useRuntimeConfig } from "#app"
import { useHomeStore } from "#imports"
import { Squirrel } from "lucide-vue-next"

const { fetchHomeMenus } = useHome()
const config = useRuntimeConfig()
const { data } = await fetchHomeMenus()
const home = useHomeStore()
</script>
