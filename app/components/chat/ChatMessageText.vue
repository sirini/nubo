<template>
  <span>
    <template v-for="(segment, index) in segments" :key="`${index}-${segment.value}`">
      <NuxtLink
        v-if="segment.type === 'hashtag'"
        :to="hashtagSearchPath(segment.value)"
        :class="[
          'font-medium underline underline-offset-2',
          inverted ? 'text-primary-foreground' : 'text-primary',
        ]"
      >
        #{{ segment.value }}
      </NuxtLink>
      <span v-else>{{ segment.value }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { hashtagSearchPath, splitChatMessage } from "~/utils/chat"

const props = withDefaults(defineProps<{ message: string; inverted?: boolean }>(), {
  inverted: false,
})
const segments = computed(() => splitChatMessage(recoverChars(props.message)))
</script>
