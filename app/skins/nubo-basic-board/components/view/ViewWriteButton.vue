<template>
  <CommonVTooltip content="새로운 글을 작성합니다">
    <NuxtLink :to="`/board/${config.id}/write`" :aria-disabled="!isLoggedIn" as-child class="gap-2">
      <Button
        variant="default"
        class="text-foreground"
        size="sm"
        :class="{ 'opacity-50 pointer-events-none': !isLoggedIn }"
      >
        <PencilIcon class="w-4 h-4" />
        새글작성
      </Button>
    </NuxtLink>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { PencilIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { config, isLoggedIn } = useNuboViewContext()
</script>
