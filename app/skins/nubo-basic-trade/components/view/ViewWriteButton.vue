<template>
  <CommonVTooltip content="새로운 글을 작성합니다">
    <Button
      variant="default"
      class="text-foreground cursor-pointer"
      size="sm"
      :class="{ 'opacity-50 pointer-events-none': !isLoggedIn }"
      as-child
    >
      <NuxtLink :to="`/board/${config.id}/write`" :aria-disabled="!isLoggedIn" class="gap-2">
        <PencilIcon class="w-4 h-4" />
        새글작성
      </NuxtLink>
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { PencilIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { config, isLoggedIn } = useNuboViewContext()
</script>
