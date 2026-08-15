<template>
  <Collapsible v-model:open="isFileListOpen" class="border-t border-border/70 bg-surface-subtle/35">
    <div class="flex w-full items-center justify-between px-5 py-3 sm:px-8">
      <h4
        class="flex cursor-pointer items-center gap-2 text-sm font-medium"
        @click="isFileListOpen = !isFileListOpen"
      >
        <FilesIcon class="w-4 h-4" />
        첨부파일 목록
      </h4>
      <CollapsibleTrigger as-child>
        <Button variant="ghost" size="sm" class="p-0 cursor-pointer">
          <ChevronsUpDownIcon class="h-4 w-4" />
          <span class="sr-only">토글</span>
        </Button>
      </CollapsibleTrigger>
    </div>
    <CollapsibleContent>
      <TooltipProvider>
        <Tooltip
          v-for="(file, index) in view.files"
          :key="index"
          :delay-duration="250"
        >
          <TooltipTrigger as-child>
            <button
              type="button"
              class="inline-flex w-full cursor-pointer items-center border-t border-border/55 px-5 py-3 font-mono text-sm transition-colors hover:bg-accent/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-8"
              @click="downloadFile(file.uid)"
            >
              <DownloadIcon class="w-4 h-4 mr-3" />
              <span class="truncate text-xs">{{ file.name }}</span>
              <span class="flex-1"></span>
              <span class="text-xs">{{ num(file.size) }}B</span>
            </button>
          </TooltipTrigger>

          <TooltipContent
            v-if="getImagePreview(file.uid)"
            side="top"
            class="max-w-80 overflow-hidden border border-border bg-popover p-2 text-popover-foreground shadow-xl"
          >
            <img
              :src="getImagePreview(file.uid)?.thumbnail.small"
              :alt="`${file.name} 미리보기`"
              class="max-h-56 w-auto rounded-md object-contain"
            />
            <p class="mt-2 max-w-72 truncate px-1 text-center text-[0.7rem] text-muted-foreground">
              {{ file.name }}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
import { ChevronsUpDownIcon, DownloadIcon, FilesIcon } from "lucide-vue-next"
import { num } from "~/composables/useUtils"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view, downloadFile } = useNuboViewContext()
const isFileListOpen = ref<boolean>(false)
const imagePreviews = computed(
  () => new Map(view.value.images.map((image) => [image.file.uid, image])),
)
const getImagePreview = (fileUid: number) => imagePreviews.value.get(fileUid)
</script>
