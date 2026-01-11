<template>
  <CommonVTooltip content="본인이 작성하신 게시글을 수정합니다" v-if="isWriter">
    <NuxtLink :to="`/board/${config.id}/${view.post.uid}/edit`" as-child class="gap-2">
      <Button variant="outline" class="cursor-pointer">
        <FilePenLineIcon class="w-4 h-4" />
        수정하기
      </Button>
    </NuxtLink>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { FilePenLineIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { view, config, isWriter } = useNuboViewContext()
</script>
