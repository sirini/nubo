<template>
  <div class="container mx-auto min-h-[calc(100dvh-70px)] px-0 py-0 sm:px-4 sm:py-6 lg:py-10">
    <div class="flex min-h-[calc(100dvh-70px)] border-y bg-background sm:min-h-[calc(100dvh-118px)] sm:overflow-hidden sm:rounded-lg sm:border sm:shadow-xl">
      <aside class="hidden w-48 border-r bg-muted/30 md:block">
        <div class="flex h-full flex-col gap-2">
          <div class="flex h-16 items-center border-b px-6">
            <CommonVTooltip content="관리화면 첫 페이지로 이동합니다">
              <NuxtLink to="/admin" class="flex items-center gap-3 font-bold text-lg text-primary">
                <CogIcon class="w-4 h-4" />
                <span class="font-mono">Settings</span>
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
                  <div class="flex items-center">
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

      <main class="min-w-0 flex-1">
        <header class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <Sheet>
            <SheetTrigger as-child><Button variant="ghost" size="icon"><MenuIcon class="size-5" /><span class="sr-only">관리 메뉴 열기</span></Button></SheetTrigger>
            <SheetContent side="left" class="w-72 p-4">
              <SheetHeader><SheetTitle>관리자 설정</SheetTitle><SheetDescription>관리할 영역을 선택하세요.</SheetDescription></SheetHeader>
              <nav class="mt-6 space-y-2">
                <SheetClose v-for="item in menuItems" :key="item.value" as-child>
                  <Button variant="ghost" class="w-full justify-start gap-3" :class="menu === item.value && 'bg-muted'" @click="openMenu(item.value)"><component :is="item.icon" class="size-4" />{{ item.label }}</Button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
          <span class="font-semibold">{{ menuItems.find((item) => item.value === menu)?.label }}</span>
        </header>
        <section>
          <component :is="panel" :key="menu" />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CogIcon,
  AwardIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MenuIcon,
  MailIcon,
  MessageCircleWarningIcon,
  PaletteIcon,
  UsersIcon,
} from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import { ADMIN_BADGE, ADMIN_BOARD, ADMIN_DASHBOARD, ADMIN_MAIL, ADMIN_REPORT, ADMIN_SKIN, ADMIN_USER } from "~/types/admin"

defineOptions({ name: "NuboAdmin" })

const config = useRuntimeConfig()
const { panel, menu, openMenu } = useNuboAdminContext()
const menuItems = [
  { label: "대시보드", value: ADMIN_DASHBOARD, icon: LayoutDashboardIcon },
  { label: "게시판 관리", value: ADMIN_BOARD, icon: FileTextIcon },
  { label: "사용자 관리", value: ADMIN_USER, icon: UsersIcon },
  { label: "업적 배지", value: ADMIN_BADGE, icon: AwardIcon },
  { label: "신고 관리", value: ADMIN_REPORT, icon: MessageCircleWarningIcon },
  { label: "단체 메일", value: ADMIN_MAIL, icon: MailIcon },
  { label: "스킨 관리", value: ADMIN_SKIN, icon: PaletteIcon },
]
</script>
