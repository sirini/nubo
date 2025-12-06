<template>
  <div v-if="edit.files.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
    <div v-for="(file, index) in edit.files" :key="index">
      <Popover v-model:open="isPopOver[file.uid]">
        <PopoverTrigger
          as-child
          @mouseenter="openPopOver(file.uid)"
          @mouseleave="closePopOver(file.uid)"
        >
          <div class="flex items-center justify-between p-2 border rounded-md text-sm bg-card">
            <div class="flex items-center gap-2 truncate pl-2 cursor-pointer">
              <span class="truncate text-xs">{{ file.name }}</span>
              <span class="text-xs text-muted-foreground">({{ num(file.size) }}B)</span>
            </div>

            <CommonVTooltip content="이 첨부파일을 삭제합니다">
              <Button
                variant="ghost"
                size="icon"
                class="cursor-pointer"
                @click="edit.confirmRemoveFile(file.uid, index)"
              >
                <Trash2Icon class="w-4 h-4 text-red-500" />
              </Button>
            </CommonVTooltip>
          </div>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" v-if="getThumbnailPath(file.uid).length > 0">
          <img
            :src="getThumbnailPath(file.uid)"
            class="w-50 h-50 lg:w-75 lg:h-75 object-cover rounded-lg shadow-lg"
            alt="Preview"
          />
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trash2Icon } from "lucide-vue-next"
import { num } from "~/composables/useUtils"

const edit = useEditorStore()
const isPopOver = ref<Record<number, boolean>>({})

// 이미지 팝업 지연 열기
const openPopOver = useDebounceFn((uid: number) => {
  isPopOver.value[uid] = true
}, 100)

// 이미지 팝업 지연 닫기
const closePopOver = useDebounceFn((uid: number) => {
  isPopOver.value[uid] = false
}, 100)

// 이미지 미리보기 URL 반환
const getThumbnailPath = (fileUid: number) => {
  const thumb = edit.thumbnails.find((f) => f.fileUid === fileUid)
  return thumb?.thumbnail || ""
}
</script>
