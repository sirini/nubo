<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="overflow-hidden border-primary/20 p-0 sm:max-w-md">
      <div class="relative bg-gradient-to-br from-primary/15 via-background to-amber-400/10 px-6 pb-7 pt-10 text-center">
        <span
          v-for="index in 14"
          :key="index"
          class="achievement-confetti absolute top-0 h-2.5 w-1.5 rounded-full"
          :style="confettiStyle(index)"
          aria-hidden="true"
        ></span>
        <div class="relative mx-auto flex size-24 items-center justify-center rounded-full bg-background text-primary shadow-lg ring-1 ring-primary/20">
          <span class="achievement-ring absolute inset-1 rounded-full border border-dashed border-primary/30"></span>
          <UserBadgeIcon v-if="current" :badge="current" class="achievement-icon size-11" />
        </div>
        <p class="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-primary">새로운 업적</p>
        <DialogTitle class="mt-2 text-2xl">{{ current ? recoverChars(current.name) : "" }}</DialogTitle>
        <DialogDescription class="mx-auto mt-2 max-w-sm text-sm leading-6">
          {{ current ? recoverChars(current.description) : "" }}
        </DialogDescription>
        <p v-if="queue.length > 1" class="mt-3 text-xs text-muted-foreground">새 업적이 {{ queue.length - 1 }}개 더 있습니다.</p>
      </div>
      <DialogFooter class="gap-2 border-t bg-background px-6 py-4 sm:justify-center">
        <Button type="button" variant="outline" @click="showProfile">내 업적 진열장</Button>
        <Button type="button" @click="finishCurrent">확인</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue"
import type { UserBadge } from "~/types/user"

const auth = useAuthStore()
const route = useRoute()
const { acknowledgeAchievements, loadUnannouncedAchievements, refreshSignal } = useAchievementInbox()
const queue = ref<UserBadge[]>([])
const open = ref(false)
const loading = ref(false)
const acknowledging = ref(false)
const current = computed(() => queue.value[0])
const confettiColors = ["#f59e0b", "#eab308", "#fb7185", "#38bdf8", "#a78bfa"]

const confettiStyle = (index: number): CSSProperties => ({
  left: `${(index * 37) % 96}%`,
  animationDelay: `${(index % 5) * 90}ms`,
  backgroundColor: confettiColors[index % confettiColors.length],
})

const refresh = async () => {
  if (!auth.isLoggedIn || loading.value || acknowledging.value) return
  loading.value = true
  try {
    const response = await loadUnannouncedAchievements()
    if (response.success && response.result.length) {
      queue.value = response.result
      open.value = true
    }
  } catch {
    // Celebration is optional UI; a later route change safely retries the inbox.
  } finally {
    loading.value = false
  }
}

const finishCurrent = async () => {
  if (!current.value || acknowledging.value) return
  acknowledging.value = true
  const key = current.value.key
  try {
    const response = await acknowledgeAchievements([key])
    if (!response.success) return
    queue.value.shift()
    if (!queue.value.length) open.value = false
  } catch {
    // Keep the achievement visible so the user can acknowledge it on retry.
  } finally {
    acknowledging.value = false
  }
}

const showProfile = async () => {
  await finishCurrent()
  open.value = false
  await navigateTo(`/user/${auth.user.uid}`)
}

const handleOpenChange = (nextOpen: boolean) => {
  if (nextOpen) {
    open.value = true
    return
  }
  void finishCurrent()
}

watch(
  [() => auth.isLoggedIn, () => route.fullPath, refreshSignal],
  ([loggedIn]) => {
    if (loggedIn) void refresh()
    else {
      queue.value = []
      open.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.achievement-confetti {
  animation: achievement-confetti 1.15s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
.achievement-icon {
  animation: achievement-pop 650ms cubic-bezier(0.2, 1.5, 0.4, 1) both;
}
.achievement-ring {
  animation: achievement-spin 12s linear infinite;
}
@keyframes achievement-confetti {
  from { opacity: 0; transform: translateY(-1rem) rotate(0deg); }
  35% { opacity: 1; }
  to { opacity: 0; transform: translateY(14rem) rotate(420deg); }
}
@keyframes achievement-pop {
  from { opacity: 0; transform: scale(0.45) rotate(-12deg); }
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes achievement-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .achievement-confetti, .achievement-icon, .achievement-ring { animation: none; }
}
</style>
