<template>
  <component :is="icon" aria-hidden="true" />
</template>

<script setup lang="ts">
import {
  ApertureIcon,
  AwardIcon,
  CameraIcon,
  CrownIcon,
  MedalIcon,
  MessageCircleIcon,
  NotebookPenIcon,
  RibbonIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
} from "lucide-vue-next"

const props = defineProps<{ badge: { iconKey: string } }>()

const icons = {
  aperture: ApertureIcon,
  award: AwardIcon,
  camera: CameraIcon,
  crown: CrownIcon,
  medal: MedalIcon,
  "message-circle": MessageCircleIcon,
  "notebook-pen": NotebookPenIcon,
  ribbon: RibbonIcon,
  sparkles: SparklesIcon,
  star: StarIcon,
  trophy: TrophyIcon,
} as const

const icon = computed(() => icons[props.badge.iconKey as keyof typeof icons] ?? AwardIcon)
</script>
