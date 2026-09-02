<template>
  <span v-if="badges?.length" class="inline-flex shrink-0 items-center gap-1">
    <CommonVTooltip v-for="badge in badges" :key="badge.key" :content="badge.description">
      <span
        class="inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-white/30"
        role="img"
        tabindex="0"
        :aria-label="`${badge.name}: ${badge.description}`"
      >
        <UserBadgeIcon :badge="badge" class="size-2.5" />
      </span>
    </CommonVTooltip>
  </span>
</template>

<script setup lang="ts">
import type { UserBadge } from "~/types/user"

defineProps<{ badges?: UserBadge[] }>()
</script>
