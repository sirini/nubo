<template>
  <section
    v-if="description"
    class="rounded-xl border border-border/70 bg-muted/35 p-4"
    aria-label="AI 이미지 설명"
  >
    <h2 class="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
      <SparklesIcon class="size-3.5" /> AI 이미지 설명
    </h2>
    <p class="mt-3 text-sm leading-6 text-foreground/85">
      {{ recoverChars(description) }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { SparklesIcon } from "lucide-vue-next"

defineProps<{ description: string }>()
</script>
