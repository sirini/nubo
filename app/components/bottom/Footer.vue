<template>
  <div
    class="fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background/80 p-2 shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out mb-4"
    :class="isVisible ? 'bottom-4 opacity-100' : '-bottom-20 opacity-0'"
  >
    <CommonVTooltip content="첫 화면으로 이동합니다">
      <Button variant="ghost" size="icon" class="rounded-full hover:bg-muted" as-child>
        <NuxtLink to="/">
          <HouseIcon />
        </NuxtLink>
      </Button>
    </CommonVTooltip>

    <CommonVTooltip content="스크롤을 맨 위로 이동합니다">
      <Button
        variant="ghost"
        size="icon"
        class="rounded-full hover:bg-muted cursor-pointer"
        @click="moveTop"
      >
        <ArrowUpToLineIcon />
      </Button>
    </CommonVTooltip>

    <CommonVTooltip content="개인정보 보호정책을 알아봅니다">
      <Button variant="ghost" size="icon" class="rounded-full hover:bg-muted" as-child>
        <NuxtLink to="/privacy"> <ShieldCheckIcon /></NuxtLink>
      </Button>
    </CommonVTooltip>
  </div>
</template>

<script setup lang="ts">
import { ArrowUpToLineIcon, HouseIcon, ShieldCheckIcon } from "lucide-vue-next"

// 스크롤 위치 감지
const { y } = useWindowScroll()
const isVisible = ref<boolean>(true)
const lastY = ref<number>(0)

// 스크롤 방향에 따라 Dock 표시 여부 결정
watch(y, (currentY) => {
  if (currentY < 100 || currentY < lastY.value) {
    isVisible.value = true
  } else if (currentY > 100 && currentY > lastY.value) {
    isVisible.value = false
  }
  lastY.value = currentY
})

// 맨 위로 이동
const moveTop = () => {
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
}
</script>
