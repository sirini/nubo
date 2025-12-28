<template>
  <CommonVTooltip content="목록 페이지로 돌아갑니다">
    <Button as-child variant="outline">
      <NuxtLink :to="`/board/${view.config.id}/page/1`">목록보기</NuxtLink></Button
    >
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { view } = useNuboViewContext()
</script>
