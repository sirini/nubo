<template>
  <span class="reaction-summary">
    <template v-if="visible.length">
      <span v-for="item in visible" :key="item" :title="meta[item].label">
        <span aria-hidden="true">{{ meta[item].icon }}</span>
        <span class="sr-only">{{ meta[item].label }}</span>
        {{ state.reactions[item] }}
      </span>
      <span v-if="hidden > 0">+{{ hidden }}종</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { REACTIONS, REACTION_META as meta } from "~/types/reaction"
import type { ReactionState } from "~/types/reaction"

const props = defineProps<{ state: ReactionState; max?: number }>()
const visibleCount = computed(() => props.max ?? 3)
const visible = computed(() => REACTIONS.filter((item) => props.state.reactions[item] > 0).slice(0, visibleCount.value))
const hidden = computed(() => REACTIONS.filter((item) => props.state.reactions[item] > 0).length - visible.value.length)
</script>

<style scoped>
.reaction-summary { display: inline-flex; gap: .45rem; align-items: center; color: inherit; opacity: .9; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
</style>
