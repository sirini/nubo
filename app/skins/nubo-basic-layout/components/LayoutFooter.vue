<template>
  <div
    v-if="!isAdminRoute"
    class="fixed left-1/2 z-50 mb-4 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/70 bg-card/85 p-2 shadow-[0_10px_35px_oklch(0.2_0.02_50/0.12)] backdrop-blur-xl transition-all duration-300 ease-in-out"
    :class="isVisible ? 'bottom-0 opacity-100' : '-bottom-20 opacity-0'"
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

    <CommonVTooltip content="퀵 메뉴를 내립니다">
      <Button
        variant="ghost"
        size="icon"
        class="rounded-full hover:bg-muted cursor-pointer"
        @click="isVisible = false"
      >
        <CircleXIcon />
      </Button>
    </CommonVTooltip>
  </div>
</template>

<script setup lang="ts">
import { ArrowUpToLineIcon, CircleXIcon, HouseIcon } from "lucide-vue-next"
import { useNuboLayoutContext } from "~/providers/contexts/layout"

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

const { moveTop } = useNuboLayoutContext()
const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith("/admin"))
</script>
