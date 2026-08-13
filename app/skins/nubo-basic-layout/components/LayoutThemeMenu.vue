<template>
  <ClientOnly>
    <CommonVTooltip :content="tooltip">
      <Button
        variant="outline"
        size="icon"
        class="cursor-pointer"
        :aria-label="tooltip"
        @click="cycleTheme"
      >
        <SunIcon v-if="activeTheme === 'light'" />
        <MoonIcon v-else />
      </Button>
    </CommonVTooltip>

    <template #fallback>
      <Button variant="outline" size="icon" aria-label="화면 테마 불러오는 중" disabled>
        <SunIcon />
      </Button>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { MoonIcon, SunIcon } from "lucide-vue-next"

const colorMode = useColorMode()

const themeLabels = {
  light: "라이트",
  dark: "다크",
} as const

const activeTheme = computed<keyof typeof themeLabels>(() => {
  if (colorMode.preference === "light" || colorMode.preference === "dark") {
    return colorMode.preference
  }
  return colorMode.value === "dark" ? "dark" : "light"
})

const tooltip = computed(() => {
  return `화면 테마: ${themeLabels[activeTheme.value]} (클릭하여 변경)`
})

function cycleTheme() {
  colorMode.preference = activeTheme.value === "light" ? "dark" : "light"
}

onMounted(() => {
  if (colorMode.preference !== "light" && colorMode.preference !== "dark") {
    colorMode.preference = activeTheme.value
  }
})
</script>
