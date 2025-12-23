<template>
  <div class="flex items-center">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <MenuIcon class="w-6 h-6 cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-48" align="start">
        <DropdownMenuLabel class="text-gray-500 text-xs">내 계정</DropdownMenuLabel>
        <DropdownMenuGroup v-if="auth.isLoggedIn">
          <DropdownMenuItem as-child class="w-full cursor-pointer">
            <NuxtLink to="/auth/profile" class="inline-flex gap-3 items-center">
              <Avatar>
                <AvatarImage :src="auth.user.profile" alt="Profile image" />
                <AvatarFallback>{{ auth.user.name.charAt(0) }}</AvatarFallback>
              </Avatar>
              프로필 수정
            </NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuItem as-child class="w-full cursor-pointer">
            <NuxtLink to="/auth/logout" class="inline-flex gap-3 items-center"
              ><LogOutIcon class="w-4 h-4" /> 로그아웃</NuxtLink
            >
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup v-else>
          <DropdownMenuItem as-child class="w-full cursor-pointer">
            <NuxtLink to="/auth/login" class="inline-flex gap-3 items-center"
              ><LogInIcon class="w-4 h-4" /> 로그인</NuxtLink
            >
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel class="text-gray-500 text-xs">메뉴</DropdownMenuLabel>
        <DropdownMenuGroup v-if="home.menus.length > 0">
          <DropdownMenuSub v-for="(menu, index) in home.menus" :key="index">
            <DropdownMenuSubTrigger class="cursor-pointer"
              ><FoldersIcon class="w-4 h-4 mr-3" /> {{ menu.group }}</DropdownMenuSubTrigger
            >
            <DropdownMenuPortal>
              <DropdownMenuSubContent class="w-48">
                <DropdownMenuItem
                  v-for="(board, idx) in menu.boards"
                  :key="idx"
                  as-child
                  class="w-full cursor-pointer"
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

    <CommonVTooltip content="첫 화면으로 이동합니다">
      <NuxtLink to="/" class="font-bold text-lg ml-3">
        <span>{{ config.public.title }}</span>
      </NuxtLink>
    </CommonVTooltip>
  </div>
</template>

<script setup lang="ts">
import { FolderOpenIcon, FoldersIcon, LogInIcon, LogOutIcon, MenuIcon } from "lucide-vue-next"
import AvatarImage from "../ui/avatar/AvatarImage.vue"

const config = useRuntimeConfig()
const auth = useAuthStore()
const home = useHomeStore()

await home.getInitMenus()
</script>
