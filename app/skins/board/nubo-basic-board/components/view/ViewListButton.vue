<template>
  <CommonVTooltip content="목록 페이지로 돌아갑니다">
    <NuxtLink :to="`/board/${config.id}/page/1`" as-child class="gap-2">
      <Button variant="outline" class="cursor-pointer">
        <ListIcon class="w-4 h-4" />
        목록보기
      </Button>
    </NuxtLink>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { ListIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { config } = useNuboViewContext()
</script>
