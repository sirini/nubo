<template>
  <CommonVTooltip content="새로운 글을 작성합니다">
    <Button
      as-child
      variant="default"
      class="text-foreground"
      :class="{ 'opacity-50 pointer-events-none': !isLoggedIn }"
    >
      <NuxtLink :to="`/board/${view.config.id}/write`" :aria-disabled="!isLoggedIn">
        새글작성
      </NuxtLink>
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { view, isLoggedIn } = useNuboViewContext()
</script>
