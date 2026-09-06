<template>
  <Sheet v-model:open="isOpen">
    <CommonVTooltip content="나에게 온 알림들을 확인합니다">
      <SheetTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="relative cursor-pointer"
          :disabled="!isLoggedIn"
          :aria-label="unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '내 알림 목록 열기'"
        >
          <BellIcon class="w-5 h-5" />
          <span
            v-if="unreadCount > 0"
            class="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-5 text-destructive-foreground"
            aria-hidden="true"
          >
            {{ unreadCount > 99 ? "99+" : unreadCount }}
          </span>
        </Button>
      </SheetTrigger>
    </CommonVTooltip>

    <SheetContent side="right" class="w-full sm:max-w-sm overflow-y-auto">
      <SheetHeader class="text-left">
        <div class="flex items-center justify-between">
          <SheetTitle>내 알림 목록</SheetTitle>

          <CommonVTooltip content="아래 알림들을 모두 읽음으로 처리합니다">
            <Button
              variant="outline"
              size="sm"
              class="text-xs text-muted-foreground rounded-2xl mr-10 cursor-pointer flex items-center gap-2"
              :disabled="unreadCount === 0 || isReadingAll"
              @click="readAll"
            >
              <LoaderCircleIcon v-if="isReadingAll" class="w-3 h-3 animate-spin" />
              <CheckIcon v-else class="w-3 h-3" />
              모두 읽음</Button
            >
          </CommonVTooltip>
        </div>
        <SheetDescription>나에게 온 알림들을 여기서 확인합니다</SheetDescription>
      </SheetHeader>

      <div class="flex flex-col gap-2 p-3">
        <div
          v-if="notifications.length === 0"
          class="flex items-center justify-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50"
        >
          <InfoIcon class="w-4 h-4" />
          나에게 온 알림이 없습니다
        </div>

        <button
          v-for="noti in notifications"
          v-else
          :key="noti.uid"
          type="button"
          class="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="{ 'bg-accent/55': !noti.checked }"
          :aria-label="`${recoverChars(noti.fromUser.name)}님이 ${presentation(noti).action}. ${presentation(noti).callToAction}`"
          @click="open(noti)"
        >
          <div
            class="mt-2 w-2 h-2 rounded-full shrink-0"
            :class="noti.checked ? 'bg-transparent' : 'bg-primary'"
          ></div>

          <Avatar class="w-10 h-10 border">
            <AvatarImage :src="noti.fromUser.profile" :alt="noti.fromUser.name" />
            <AvatarFallback>{{ noti.fromUser.name.slice(0, 1) }}</AvatarFallback>
          </Avatar>

          <div class="min-w-0 flex-1 space-y-1">
            <div class="text-sm leading-snug">
              <span class="font-bold mr-1">{{ recoverChars(noti.fromUser.name) }}님이</span>
              <span class="text-muted-foreground">{{ presentation(noti).action }}</span>
            </div>
            <div class="flex items-center justify-between gap-2 text-xs text-muted-foreground/70">
              <span>{{ date(noti.timestamp) }}</span>
              <span class="font-medium text-primary">{{ presentation(noti).callToAction }}</span>
            </div>
          </div>
          <ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import {
  BellIcon,
  CheckIcon,
  ChevronRightIcon,
  InfoIcon,
  LoaderCircleIcon,
} from "lucide-vue-next"
import { useNuboLayoutContext } from "~/providers/contexts/layout"
import type { NotificationItem } from "~/types/home"
import { getNotificationPresentation } from "~/utils/notification"

const { isLoggedIn, notifications, loadNotifications, openNotification, readAllNotifications } =
  useNuboLayoutContext()
const isOpen = ref(false)
const isReadingAll = ref(false)
const unreadCount = computed(
  () => notifications.value.filter((notification) => !notification.checked).length,
)
const presentation = (notification: NotificationItem) =>
  getNotificationPresentation(notification.type)

watch(isOpen, (open) => {
  if (open && isLoggedIn.value) void loadNotifications(10)
})

const open = async (notification: NotificationItem) => {
  isOpen.value = false
  await openNotification(notification)
}

const readAll = async () => {
  if (isReadingAll.value || unreadCount.value === 0) return
  isReadingAll.value = true
  try {
    await readAllNotifications()
  } finally {
    isReadingAll.value = false
  }
}
</script>
