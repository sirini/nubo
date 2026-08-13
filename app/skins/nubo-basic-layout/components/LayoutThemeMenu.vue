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
        <MonitorIcon v-if="colorMode.preference === 'system'" />
        <SunIcon v-else-if="colorMode.preference === 'light'" />
        <MoonIcon v-else />
      </Button>
    </CommonVTooltip>

    <template #fallback>
      <Button variant="outline" size="icon" aria-label="화면 테마 불러오는 중" disabled>
        <MonitorIcon />
      </Button>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-vue-next"

const colorMode = useColorMode()

const themeLabels: Record<string, string> = {
  system: "시스템",
  light: "라이트",
  dark: "다크",
}

const tooltip = computed(() => {
  const current = themeLabels[colorMode.preference] ?? themeLabels.system
  return `화면 테마: ${current} (클릭하여 변경)`
})

function cycleTheme() {
  const themes = ["system", "light", "dark"]
  const currentIndex = themes.indexOf(colorMode.preference)
  colorMode.preference = themes[(currentIndex + 1) % themes.length] ?? "system"
}
</script>
