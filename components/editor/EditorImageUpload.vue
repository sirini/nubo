<template>
  <Dialog v-model="edit.isUploadingImages">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>이미지 업로드</DialogTitle>
        <DialogDescription
          >내용에 삽입할 이미지들을 업로드 합니다. ({{ config.public.imageSize.contentInsert }}px
          보다 크면 리사이즈)</DialogDescription
        >
      </DialogHeader>

      <DialogFooter>
        <DialogClose as-child class="inline-flex">
          <Button type="button" variant="outline">닫기</Button>
          <div class="flex-1"></div>
          <Button type="button">업로드 및 삽입</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useEditorStore, useRuntimeConfig } from "#imports"

const edit = useEditorStore()
const config = useRuntimeConfig()
</script>
