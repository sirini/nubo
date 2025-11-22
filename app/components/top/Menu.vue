<template>
  <div class="flex items-center">
    <CommonVTooltip content="첫 화면으로 이동합니다">
      <NuxtLink to="/" class="font-bold text-lg mr-3">
        <span>{{ config.public.title }}</span>
      </NuxtLink>
    </CommonVTooltip>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <MenuIcon class="w-6 h-6 cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-48" align="start">
        <DropdownMenuLabel class="text-gray-500">내 계정</DropdownMenuLabel>
        <DropdownMenuGroup v-if="auth.isLoggedIn">
          <DropdownMenuItem as-child class="w-full">
            <NuxtLink to="/auth/profile" class="inline-flex gap-3 items-center">
              <UserPenIcon class="w-4 h-4" /> 프로필 수정
            </NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuItem as-child class="w-full">
            <NuxtLink to="/auth/logout" class="inline-flex gap-3 items-center"
              ><LogOutIcon class="w-4 h-4" /> 로그아웃</NuxtLink
            >
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup v-else>
          <DropdownMenuItem as-child class="w-full">
            <NuxtLink to="/auth/login" class="inline-flex gap-3 items-center"
              ><LogInIcon class="w-4 h-4" /> 로그인</NuxtLink
            >
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel class="text-gray-500">메뉴</DropdownMenuLabel>
        <DropdownMenuGroup v-if="data">
          <DropdownMenuSub v-for="(menu, index) in data.result" :key="index">
            <DropdownMenuSubTrigger
              ><FoldersIcon class="w-4 h-4 mr-3" /> {{ menu.group }}</DropdownMenuSubTrigger
            >
            <DropdownMenuPortal>
              <DropdownMenuSubContent class="w-48">
                <DropdownMenuItem
                  v-for="(board, idx) in menu.boards"
                  :key="idx"
                  as-child
                  class="w-full"
                >
                  <NuxtLink :to="`/board/${board.id}`" class="inline-flex gap-3 items-center">
                    <FolderOpenIcon class="w-4 h-4" />
                    {{ board.name }}
                  </NuxtLink>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useRuntimeConfig } from "#app"
import { useHomeStore } from "#imports"
import {
  FolderOpenIcon,
  FoldersIcon,
  LogInIcon,
  LogOutIcon,
  MenuIcon,
  UserPenIcon,
} from "lucide-vue-next"

const { fetchHomeMenus } = useHome()
const config = useRuntimeConfig()
const { data } = await fetchHomeMenus()
const home = useHomeStore()
const auth = useAuthStore()
</script>
