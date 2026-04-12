<template>
  <Collapsible v-if="view.files.length > 0" v-model:open="isFileListOpen" class="border-t">
    <div class="flex items-center justify-between w-full p-3">
      <h4
        class="text-sm cursor-pointer pl-1 flex items-center gap-2"
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
      <div
        v-for="(file, index) in view.files"
        :key="index"
        @click="downloadFile(file.uid)"
        class="border-b px-4 py-3 font-mono text-sm inline-flex items-center cursor-pointer w-full hover:bg-muted hover:text-blue-500 transition-colors"
      >
        <DownloadIcon class="w-4 h-4 mr-3" />
        <span class="text-xs">{{ file.name }}</span>
        <span class="flex-1"></span>
        <span class="text-xs">{{ num(file.size) }}B</span>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
import { ChevronsUpDownIcon, DownloadIcon, FilesIcon } from "lucide-vue-next"
import { num } from "~/composables/useUtils"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view, downloadFile } = useNuboViewContext()
const isFileListOpen = ref<boolean>(false)
</script>
