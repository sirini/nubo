<template>
  <div class="reaction-picker" @keydown.esc.stop="close">
    <button type="button" class="trigger" :aria-expanded="open" @click="toggle">
      <span class="current">{{ current ? meta[current].icon : "🙂" }}</span>
      <span class="label">{{ current ? meta[current].label : "반응" }}</span>
    </button>
    <div v-if="open" class="menu" role="group" aria-label="리액션 선택">
      <button
        v-for="item in REACTIONS"
        :key="item"
        type="button"
        :aria-pressed="state.myReaction === item"
        :class="{ selected: state.myReaction === item }"
        @click="select(item)"
      >
        <span aria-hidden="true">{{ meta[item].icon }}</span>
        <span class="label">{{ meta[item].label }}</span>
        <span class="count">{{ state.reactions[item] }}</span>
      </button>
      <button v-if="state.myReaction" type="button" @click="select(null)">선택 취소</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { REACTIONS, REACTION_META as meta } from "~/types/reaction"
import type { Reaction, ReactionState } from "~/types/reaction"

const props = defineProps<{ state: ReactionState; disabled?: boolean }>()
const emit = defineEmits<{ (event: "select", reaction: Reaction | null): void }>()
const open = ref(false)

const current = computed(() => props.state.myReaction)
const toggle = () => {
  if (!props.disabled) open.value = !open.value
}
const close = () => {
  open.value = false
}
const select = (reaction: Reaction | null) => {
  open.value = false
  emit("select", reaction)
}
</script>

<style scoped>
.trigger, .menu button { display: inline-flex; gap: .25rem; align-items: center; border: 1px solid color-mix(in srgb, currentColor 20%, transparent); border-radius: 999px; padding: .2rem .55rem; background: transparent; color: inherit; }
.menu { position: absolute; z-index: 20; margin-top: .35rem; display: grid; gap: .25rem; padding: .5rem; border-radius: .75rem; background: var(--surface, #fff); color: var(--foreground, #222); box-shadow: 0 8px 24px rgb(0 0 0 / 12%); }
.selected { font-weight: 700; }
</style>
