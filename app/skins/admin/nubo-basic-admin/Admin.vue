<template>
  <div class="flex container mx-auto min-h-[calc(100dvh-70px)] py-10 px-4">
    <div class="flex flex-1 border rounded-lg bg-background overflow-hidden shadow-xl">
      <aside class="hidden w-64 border-r bg-muted/30 md:block">
        <div class="flex h-full flex-col gap-2">
          <div class="flex h-16 items-center border-b px-6">
            <CommonVTooltip content="관리화면 첫 페이지로 이동합니다">
              <NuxtLink to="/admin" class="flex items-center gap-3 font-bold text-xl text-primary">
                <CogIcon class="w-4 h-4" />
                <span class="font-mono">ADMIN</span>
              </NuxtLink>
            </CommonVTooltip>
          </div>

          <nav class="flex-1 overflow-y-auto p-4 space-y-2">
            <Button
              v-for="item in menuItems"
              :key="item.value"
              variant="ghost"
              class="w-full justify-start gap-3 cursor-pointer transition-colors"
              :class="menu !== item.value ? 'text-muted-foreground opacity-70' : 'bg-secondary'"
              @click="openMenu(item.value)"
            >
              <component :is="item.icon" class="w-4 h-4" />
              {{ item.label }}
            </Button>
          </nav>
        </div>
      </aside>

      <main class="flex flex-1 flex-col overflow-hidden">
        <header
          class="flex h-16 items-center justify-between border-b px-8 bg-background/95 backdrop-blur"
        >
          <h2 class="text-lg font-semibold tracking-tight">Dashboard</h2>
          <div class="flex items-center gap-4">
            <Button variant="outline" size="icon" class="rounded-full">
              <BellIcon class="w-4 h-4" />
            </Button>
          </div>
        </header>

        <section class="flex-1 overflow-y-auto p-8">
          <ScrollArea class="max-h-60">
            <component :is="panel" :key="menu" />
          </ScrollArea>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BellIcon,
  CogIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MessageCircleWarningIcon,
  UsersIcon,
} from "lucide-vue-next"
import { ADMIN_BOARD, ADMIN_DASHBOARD, ADMIN_REPORT, ADMIN_USER } from "~/types/admin"
import { useNuboAdminContext } from "~/types/nubo-skin-keys"

const { panel, menu, openMenu } = useNuboAdminContext()
const menuItems = [
  { label: "대시보드", value: ADMIN_DASHBOARD, icon: LayoutDashboardIcon },
  { label: "게시판 관리", value: ADMIN_BOARD, icon: FileTextIcon },
  { label: "사용자 관리", value: ADMIN_USER, icon: UsersIcon },
  { label: "신고 관리", value: ADMIN_REPORT, icon: MessageCircleWarningIcon },
]
</script>
