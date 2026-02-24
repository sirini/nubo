<template>
  <div class="flex container mx-auto min-h-[calc(100dvh-70px)] py-10 px-4">
    <div class="flex flex-1 border rounded-lg bg-background overflow-hidden shadow-xl">
      <aside class="hidden w-56 border-r bg-muted/30 md:block">
        <div class="flex h-full flex-col gap-2">
          <div class="flex h-16 items-center border-b px-6">
            <CommonVTooltip content="관리화면 첫 페이지로 이동합니다">
              <NuxtLink to="/admin" class="flex items-center gap-3 font-bold text-xl text-primary">
                <CogIcon class="w-4 h-4" />
                <span class="font-mono">NUBO</span>
              </NuxtLink>
            </CommonVTooltip>
          </div>

          <nav class="flex-1 overflow-y-auto p-4 space-y-2">
            <Button
              v-for="item in menuItems"
              :key="item.value"
              variant="ghost"
              class="w-full justify-start gap-3 cursor-pointer transition-colors"
              :class="menu !== item.value ? 'text-muted-foreground opacity-70' : 'bg-muted'"
              @click="openMenu(item.value)"
            >
              <component :is="item.icon" class="w-4 h-4" />
              {{ item.label }}
            </Button>
          </nav>

          <div class="p-2 border-t bg-card/20 shrink-0">
            <div class="flex flex-col gap-2">
              <CommonVTooltip
                content="NUBO 사이트를 엽니다 : 다른 사용자분들과 노하우를 나눠보세요!"
              >
                <a
                  href="https://nubohub.org"
                  target="_blank"
                  class="flex items-center justify-between group px-2 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span
                      class="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors"
                    >
                      NUBO {{ config.public.version }}
                    </span>
                  </div>

                  <ExternalLinkIcon
                    class="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors"
                  />
                </a>
              </CommonVTooltip>
            </div>
          </div>
        </div>
      </aside>

      <main class="flex flex-1 flex-col overflow-hidden">
        <section class="flex-1 overflow-y-auto">
          <component :is="panel" :key="menu" />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CogIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MessageCircleWarningIcon,
  PaletteIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-vue-next"
import {
  ADMIN_BOARD,
  ADMIN_DASHBOARD,
  ADMIN_REPORT,
  ADMIN_SKIN,
  ADMIN_SYSTEM,
  ADMIN_USER,
} from "~/types/admin"
import { useNuboAdminContext } from "~/providers/contexts/admin"

const config = useRuntimeConfig()
const { panel, menu, openMenu } = useNuboAdminContext()
const menuItems = [
  { label: "대시보드", value: ADMIN_DASHBOARD, icon: LayoutDashboardIcon },
  { label: "게시판 관리", value: ADMIN_BOARD, icon: FileTextIcon },
  { label: "사용자 관리", value: ADMIN_USER, icon: UsersIcon },
  { label: "신고 관리", value: ADMIN_REPORT, icon: MessageCircleWarningIcon },
  { label: "스킨 관리", value: ADMIN_SKIN, icon: PaletteIcon },
  { label: "시스템 설정", value: ADMIN_SYSTEM, icon: SettingsIcon },
]
</script>
