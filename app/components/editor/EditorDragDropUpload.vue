<template>
  <div
    @click="triggerAttach"
    @dragover.prevent="edit.isDragging = true"
    @dragenter.prevent="edit.isDragging = true"
    @dragleave.prevent="edit.isDragging = false"
    @drop.prevent="edit.dropAttaches"
    class="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 hover:border-accent cursor-pointer transition-all"
    :class="[
      edit.isDragging
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-muted-foreground hover:bg-accent/50 hover:border-accent',
    ]"
  >
    <UploadCloudIcon class="w-8 h-8 mb-2 opacity-70" />
    <p class="text-sm font-medium">클릭하여 파일을 선택하세요</p>
    <p class="text-xs text-muted-foreground/70">또는 파일을 여기로 드래그하세요</p>
    <input ref="attach" type="file" multiple class="hidden" @change="edit.handleAttachChange" />
  </div>

  <div v-if="edit.attaches.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
    <div
      v-for="(attach, index) in edit.attaches"
      :key="index"
      class="flex items-center justify-between p-2 border rounded text-sm bg-card"
    >
      <div class="flex items-center gap-2 truncate">
        <FileIcon class="w-4 h-4 text-blue-500" />
        <span class="truncate">{{ attach.name }}</span>
        <span class="text-xs text-muted-foreground">({{ showReadableNumber(attach.size) }}B)</span>
      </div>
      <Button variant="ghost" size="icon" class="w-6 h-6" @click="edit.removeAttach(index)">
        <XIcon class="w-3 h-3" />
      </Button>
    </div>
  </div>

  <div v-if="edit.files.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
    <div
      v-for="(file, index) in edit.files"
      :key="index"
      class="flex items-center justify-between p-2 border rounded text-sm bg-card"
    >
      <div class="flex items-center gap-2 truncate">
        <FileIcon class="w-4 h-4 text-blue-500" />
        <span class="truncate">{{ file.name }}</span>
        <span class="text-xs text-muted-foreground">({{ showReadableNumber(file.size) }}B)</span>
      </div>
      <Button variant="ghost" size="icon" class="w-6 h-6" @click="edit.removeFile(file.uid, index)">
        <XIcon class="w-3 h-3" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-vue-next"
import { showReadableNumber } from "~/lib/utils"

const edit = useEditorStore()
const attach = ref<HTMLInputElement | null>(null)

// 첨부파일 선택하기
const triggerAttach = () => {
  attach.value?.click()
}
</script>
