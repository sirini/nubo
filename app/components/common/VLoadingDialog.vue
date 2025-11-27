<template>
  <Dialog v-model:open="edit.isWriting">
    <DialogContent
      class="sm:max-w-[300px] flex flex-col items-center justify-center gap-4 py-8 [&>button]:hidden"
      @pointer-down-outside.prevent
      @escape-key-down.prevent
    >
      <Button disabled>
        <Spinner />
        {{ message || "잠시만 기다려주세요" }}
      </Button>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const edit = useEditorStore()

defineProps<{
  message?: string
}>()
</script>
