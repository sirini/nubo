<template>
  <CommonVTooltip v-if="isWriter || isAdmin" content="이 게시글을 수정합니다">
    <Button variant="outline" class="cursor-pointer" as-child>
      <NuxtLink :to="`/board/${config.id}/${view.post.uid}/edit`" class="gap-2">
        <FilePenLineIcon class="w-4 h-4" />
        수정하기
      </NuxtLink>
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { FilePenLineIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view, config, isAdmin, isWriter } = useNuboViewContext()
</script>
