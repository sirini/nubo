<template>
  <Collapsible class="flex w-full flex-col gap-2 p-3">
    <CollapsibleTrigger class="flex items-center gap-2 cursor-pointer justify-between">
      {{ title }}
      <ChevronsUpDownIcon class="w-4 h-4" />
    </CollapsibleTrigger>
    <CollapsibleContent class="text-muted-foreground">
      <slot ></slot>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
import { ChevronsUpDownIcon } from "lucide-vue-next"

defineProps<{
  title: string
}>()
</script>
