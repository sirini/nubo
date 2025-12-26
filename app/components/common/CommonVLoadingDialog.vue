<template>
  <Dialog v-model:open="edit.isWriting">
    <DialogContent
      class="sm:max-w-75 flex flex-col items-center justify-center gap-4 py-8"
      @pointer-down-outside.prevent
      @escape-key-down.prevent
    >
      <Spinner />
      {{ message || "잠시만 기다려주세요" }}
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const edit = useEditorStore()

defineProps<{
  message?: string
}>()
</script>
