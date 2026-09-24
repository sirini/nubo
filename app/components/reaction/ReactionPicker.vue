<template>
  <div class="reaction-picker">
    <CommonVTooltip v-if="disabled" content="리액션을 남기려면 로그인">
      <button
        type="button"
        class="trigger"
        aria-label="리액션을 남기려면 로그인"
        @click="navigateToLogin"
      >
        <span aria-hidden="true">{{ current ? meta[current].icon : "🙂" }}</span>
      </button>
    </CommonVTooltip>
    <Popover v-else v-model:open="open">
      <CommonVTooltip :content="current ? `현재 리액션: ${meta[current].label}` : '리액션 선택'">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="trigger"
            :aria-label="current ? `리액션 선택, 현재 ${meta[current].label}` : '리액션 선택'"
          >
            <span aria-hidden="true">{{ current ? meta[current].icon : "🙂" }}</span>
          </button>
        </PopoverTrigger>
      </CommonVTooltip>
      <PopoverContent align="start" class="w-max max-w-[calc(100vw-2rem)] p-2">
        <div class="menu" role="group" aria-label="리액션 선택">
          <CommonVTooltip
            v-for="item in REACTIONS"
            :key="item"
            :content="`${meta[item].label} · ${state.reactions[item]}개${state.myReaction === item ? ' · 선택 취소' : ''}`"
          >
            <button
              type="button"
              :aria-pressed="state.myReaction === item"
              :aria-label="state.myReaction === item ? `${meta[item].label} ${state.reactions[item]}개, 선택 취소` : `${meta[item].label} 선택, ${state.reactions[item]}개`"
              :class="['choice', { selected: state.myReaction === item }]"
              @click="select(item)"
            >
              <span aria-hidden="true">{{ meta[item].icon }}</span>
            </button>
          </CommonVTooltip>
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
.trigger, .choice { display: inline-flex; align-items: center; justify-content: center; border: 1px solid color-mix(in srgb, currentColor 20%, transparent); border-radius: 999px; background: transparent; color: inherit; line-height: 1; }
.trigger { width: 2.25rem; height: 2.25rem; font-size: 1.25rem; }
.choice { width: 2.5rem; height: 2.5rem; font-size: 1.35rem; }
.trigger:hover, .choice:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
.trigger:focus-visible, .choice:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.menu { display: grid; grid-template-columns: repeat(4, 2.5rem); gap: .375rem; }
.selected { border-width: 2px; background: color-mix(in srgb, currentColor 10%, transparent); }
</style>
