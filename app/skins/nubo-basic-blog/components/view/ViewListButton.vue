<template>
  <CommonVTooltip content="목록 페이지로 돌아갑니다">
    <Button variant="outline" class="cursor-pointer" as-child>
      <NuxtLink :to="`/board/${config.id}/page/${listPage}`" class="gap-2">
        <ListIcon class="w-4 h-4" />
        목록보기
      </NuxtLink>
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { ListIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"
const listPage = computed(() => {
  const page = useRoute().query.page
  return typeof page === "string" && /^[1-9][0-9]*$/.test(page) ? page : "1"
})

const { config } = useNuboViewContext()
</script>
