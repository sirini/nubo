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
    <div v-for="(attach, index) in edit.attaches" :key="index">
      <Popover v-model:open="isPopOver[attach.name]">
        <PopoverTrigger
          as-child
          @mouseenter="openPopOver(attach.name)"
          @mouseleave="closePopOver(attach.name)"
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
                @click="edit.removeAttach(index)"
                class="cursor-pointer"
              >
                <XIcon class="w-4 h-4" />
              </Button>
            </CommonVTooltip>
          </div>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" v-if="getThumbnailPath(attach.name).length > 0">
          <img
            :src="getThumbnailPath(attach.name)"
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
import { num } from "~/lib/utils"

const edit = useEditorStore()
const isPopOver = ref<Record<string, boolean>>({})
const attach = ref<HTMLInputElement | null>(null)

// 첨부파일 선택하기
const triggerAttach = () => {
  attach.value?.click()
}

// 이미지 팝업 지연 열기
const openPopOver = useDebounceFn((name: string) => {
  isPopOver.value[name] = true
}, 100)

// 이미지 팝업 지연 닫기
const closePopOver = useDebounceFn((name: string) => {
  isPopOver.value[name] = false
}, 100)

// 미리보기용 이미지 찾아서 반환
const getThumbnailPath = (fileName: string) => {
  const thumb = edit.previewEditorSelectedImages.find((f) => f.name === fileName)
  return thumb?.url || ""
}
</script>
