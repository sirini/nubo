<template>
  <Dialog v-model:open="model">
    <DialogContent
      class="sm:max-w-75 grid items-center justify-center py-6"
      @pointer-down-outside.prevent
      @escape-key-down.prevent
    >
      <DialogHeader class="space-y-1">
        <DialogTitle>진행중</DialogTitle>
        <DialogDescription>잠시만 기다려주세요</DialogDescription>
      </DialogHeader>
      <div class="flex items-center gap-3 pt-2">
        <Spinner />
        <div>{{ message || "작업을 진행중입니다..." }}</div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const model = defineModel<boolean>()

defineProps<{
  message?: string
}>()
</script>
