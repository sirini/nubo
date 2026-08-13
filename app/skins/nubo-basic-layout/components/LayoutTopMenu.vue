<template>
  <div class="flex min-w-0 items-center">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <MenuIcon class="w-6 h-6 cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-48" align="start">
        <DropdownMenuLabel class="text-xs text-muted-foreground">내 계정</DropdownMenuLabel>
        <DropdownMenuGroup v-if="isLoggedIn">
          <DropdownMenuItem as-child class="w-full cursor-pointer">
            <NuxtLink :to="`/user/${user.uid}`" class="inline-flex gap-3 items-center">
              <Avatar>
                <AvatarImage :src="user.profile" alt="Profile image" />
                <AvatarFallback>{{ user.name.charAt(0) }}</AvatarFallback>
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

        <DropdownMenuLabel class="text-xs text-muted-foreground">메뉴</DropdownMenuLabel>
        <DropdownMenuGroup v-if="menus.length > 0">
          <DropdownMenuSub v-for="(menu, index) in menus" :key="index">
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
                  <NuxtLink
                    :to="`/board/${board.id}/page/1`"
                    class="inline-flex gap-3 items-center"
                  >
                    <FolderOpenIcon class="w-4 h-4" />
                    {{ board.name }}
                  </NuxtLink>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel class="text-xs text-muted-foreground">기타</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem as-child class="w-full cursor-pointer">
            <NuxtLink to="/" class="inline-flex gap-3 items-center">
              <HomeIcon class="w-4 h-4" />첫 화면
            </NuxtLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem as-child class="w-full cursor-pointer">
            <NuxtLink to="/privacy" class="inline-flex gap-3 items-center">
              <ShieldCheckIcon class="w-4 h-4" /> 개인정보 보호정책</NuxtLink
            >
          </DropdownMenuItem>
          <DropdownMenuItem as-child class="w-full cursor-pointer" v-if="isAdmin">
            <NuxtLink to="/admin" class="inline-flex gap-3 items-center">
              <CogIcon class="w-4 h-4" /> 관리화면
            </NuxtLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>

    <CommonVTooltip content="첫 화면으로 이동합니다">
      <NuxtLink to="/" class="ml-3 min-w-0">
        <span class="block truncate text-base font-semibold tracking-[-0.02em] sm:text-lg">
          {{ config.public.title }}
        </span>
      </NuxtLink>
    </CommonVTooltip>
  </div>
</template>

<script setup lang="ts">
import {
  CogIcon,
  FolderOpenIcon,
  FoldersIcon,
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  MenuIcon,
  ShieldCheckIcon,
} from "lucide-vue-next"
import { useNuboLayoutContext } from "~/providers/contexts/layout"

const config = useRuntimeConfig()
const { isLoggedIn, isAdmin, user, menus } = useNuboLayoutContext()
</script>
