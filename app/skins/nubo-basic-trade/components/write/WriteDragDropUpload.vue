<template>
  <div
    class="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 hover:border-accent cursor-pointer transition-all"
    :class="[
      isDragging
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-muted-foreground hover:bg-accent/50 hover:border-accent',
    ]"
    @click="triggerAttach"
    @dragover.prevent="isDragging = true"
    @dragenter.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="dropAttaches"
  >
    <UploadCloudIcon class="w-8 h-8 mb-2 opacity-70" />
    <p class="text-sm font-medium">클릭하여 파일을 선택하세요</p>
    <p class="text-xs text-muted-foreground/70">또는 파일을 여기로 드래그하세요</p>
    <input ref="attachRef" type="file" multiple class="hidden" @change="changeFileList" />
  </div>

  <div v-if="attaches.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
    <div v-for="(attach, index) in attaches" :key="index">
      <Popover v-model:open="isPopOver[`${attach.name}-${index}`]">
        <PopoverTrigger
          as-child
          @mouseenter="openPopOver(`${attach.name}-${index}`)"
          @mouseleave="closePopOver(`${attach.name}-${index}`)"
        >
          <div class="flex items-center justify-between p-2 border rounded-md text-sm bg-card">
            <div class="flex items-center gap-2 truncate pl-2 cursor-pointer">
              <span class="truncate text-xs">{{ attach.name }}</span>
              <span class="text-xs text-muted-foreground">({{ num(attach.size) }}B)</span>
            </div>

            <CommonVTooltip content="이 파일을 첨부파일 목록에서 뺍니다">
              <Button
                variant="ghost"
                size="icon"
                class="cursor-pointer"
                @click="removeFromList(index)"
              >
                <XIcon class="w-4 h-4" />
              </Button>
            </CommonVTooltip>
          </div>
        </PopoverTrigger>
        <PopoverContent v-if="getPreviewThumbnail(attach.name).length > 0" class="w-auto p-0">
          <img
            :src="getPreviewThumbnail(attach.name)"
            alt="Preview"
            class="w-50 h-50 lg:w-75 lg:h-75 object-cover rounded-lg shadow-lg"
          />
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UploadCloudIcon, XIcon } from "lucide-vue-next"
import { num } from "~/composables/useUtils"
import { useNuboWriteContext } from "~/providers/contexts/write"

const attachRef = ref<HTMLInputElement | null>(null)

// 첨부파일 선택하기
const triggerAttach = () => {
  if (attachRef.value) {
    attachRef.value.value = ""
    attachRef.value?.click()
  }
}

const {
  attaches,
  isDragging,
  isPopOver,
  dropAttaches,
  changeFileList,
  openPopOver,
  closePopOver,
  getPreviewThumbnail,
  removeFromList,
} = useNuboWriteContext()
</script>
