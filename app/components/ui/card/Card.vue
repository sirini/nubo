<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "~/composables/useUtils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border border-border/70 py-6 shadow-[0_1px_2px_oklch(0.2_0.02_50/0.04)]',
        props.class,
      )
    "
  >
    <slot></slot>
  </div>
</template>
