<template>
  <CommonVTooltip content="본인이 작성하신 게시글을 수정합니다" v-if="isWriter">
    <Button as-child variant="outline">
      <NuxtLink :to="`/board/${view.config.id}/modify/${view.post.uid}`">수정하기</NuxtLink>
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { view, isWriter } = useNuboViewContext()
</script>
