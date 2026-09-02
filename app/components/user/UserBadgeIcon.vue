<template>
  <component :is="icon" aria-hidden="true" />
</template>

<script setup lang="ts">
import { ApertureIcon, AwardIcon, MessageCircleIcon, NotebookPenIcon } from "lucide-vue-next"
import type { UserBadge } from "~/types/user"

const props = defineProps<{ badge: UserBadge }>()

const icons = {
  aperture: ApertureIcon,
  "message-circle": MessageCircleIcon,
  "notebook-pen": NotebookPenIcon,
} as const

const icon = computed(() => icons[props.badge.iconKey as keyof typeof icons] ?? AwardIcon)
</script>
