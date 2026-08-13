<template>
  <Sheet>
    <CommonVTooltip content="나에게 온 알림들을 확인합니다">
      <SheetTrigger as-child>
        <Button variant="outline" size="icon" class="cursor-pointer" :disabled="!isLoggedIn">
          <BellIcon class="w-5 h-5" />
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
            >
              <CheckIcon class="w-3 h-3" />
              모두 읽음</Button
            >
          </CommonVTooltip>
        </div>
        <SheetDescription>나에게 온 알림들을 여기서 확인합니다</SheetDescription>
      </SheetHeader>

      <div class="flex flex-col gap-2 p-3">
        <div
          class="flex items-center justify-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50"
          v-if="notifications.length === 0"
        >
          <InfoIcon class="w-4 h-4" />
          나에게 온 알림이 없습니다
        </div>

        <div
          v-for="noti in notifications"
          :key="noti.uid"
          class="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50"
          :class="{ 'bg-accent/55': !noti.checked }"
          v-else
        >
          <div
            class="mt-2 w-2 h-2 rounded-full shrink-0"
            :class="noti.checked ? 'bg-transparent' : 'bg-primary'"
          ></div>

          <Avatar class="w-10 h-10 border">
            <AvatarImage :src="noti.fromUser.profile" :alt="noti.fromUser.name" />
            <AvatarFallback>{{ noti.fromUser.name.slice(0, 1) }}</AvatarFallback>
          </Avatar>

          <div class="flex-1 space-y-1">
            <div class="text-sm leading-snug">
              <span class="font-bold mr-1">{{ noti.fromUser.name }}</span>
              <span class="text-muted-foreground">{{ noti.type }}</span>
            </div>
            <div class="text-xs text-muted-foreground/70">{{ date(noti.timestamp) }}</div>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { BellIcon, CheckIcon, InfoIcon } from "lucide-vue-next"
import { useNuboLayoutContext } from "~/providers/contexts/layout"

const { isLoggedIn, notifications } = useNuboLayoutContext()
</script>
