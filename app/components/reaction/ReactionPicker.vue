<template>
  <div class="reaction-picker">
    <button
      v-if="disabled"
      type="button"
      class="trigger"
      aria-label="리액션을 남기려면 로그인"
      @click="navigateToLogin"
    >
      <span class="current" aria-hidden="true">{{ current ? meta[current].icon : "🙂" }}</span>
      <span class="label">{{ current ? meta[current].label : "반응" }}</span>
    </button>
    <Popover v-else v-model:open="open">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="trigger"
          :aria-label="current ? `리액션 선택, 현재 ${meta[current].label}` : '리액션 선택'"
        >
          <span class="current" aria-hidden="true">{{ current ? meta[current].icon : "🙂" }}</span>
          <span class="label">{{ current ? meta[current].label : "반응" }}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" class="w-max max-w-[calc(100vw-2rem)] p-2">
        <div class="menu" role="group" aria-label="리액션 선택">
          <button
            v-for="item in REACTIONS"
            :key="item"
            type="button"
            :aria-pressed="state.myReaction === item"
            :aria-label="state.myReaction === item ? `${meta[item].label} ${state.reactions[item]}개, 선택 취소` : `${meta[item].label} 선택, ${state.reactions[item]}개`"
            :class="{ selected: state.myReaction === item }"
            @click="select(item)"
          >
            <span aria-hidden="true">{{ meta[item].icon }}</span>
            <span class="label">{{ meta[item].label }}</span>
            <span class="count">{{ state.reactions[item] }}</span>
          </button>
          <button v-if="state.myReaction" type="button" @click="select(null)">선택 취소</button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { REACTIONS, REACTION_META as meta } from "~/types/reaction"
import type { Reaction, ReactionState } from "~/types/reaction"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"

const props = defineProps<{ state: ReactionState; disabled?: boolean }>()
const emit = defineEmits<{ (event: "select", reaction: Reaction | null): void }>()
const open = ref(false)
const route = useRoute()

const current = computed(() => props.state.myReaction)
const navigateToLogin = () => navigateTo({ path: "/auth/login", query: { redirect: route.fullPath } })
const select = (reaction: Reaction | null) => {
  open.value = false
  emit("select", reaction === current.value ? null : reaction)
}
</script>

<style scoped>
.trigger, .menu button { display: inline-flex; gap: .25rem; align-items: center; border: 1px solid color-mix(in srgb, currentColor 20%, transparent); border-radius: 999px; padding: .2rem .55rem; background: transparent; color: inherit; }
.menu { display: grid; gap: .25rem; }
.selected { font-weight: 700; }
</style>
