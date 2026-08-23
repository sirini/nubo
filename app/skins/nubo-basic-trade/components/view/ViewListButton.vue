<template>
  <CommonVTooltip content="목록 페이지로 돌아갑니다">
    <Button variant="outline" class="cursor-pointer" as-child>
      <NuxtLink :to="`/board/${config.id}/page/1`" class="gap-2">
        <ListIcon class="w-4 h-4" />
        목록보기
      </NuxtLink>
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { ListIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { config } = useNuboViewContext()
</script>
