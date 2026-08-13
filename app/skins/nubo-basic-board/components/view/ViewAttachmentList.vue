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
      <div
        v-for="(file, index) in view.files"
        :key="index"
        @click="downloadFile(file.uid)"
        class="inline-flex w-full cursor-pointer items-center border-t border-border/55 px-5 py-3 font-mono text-sm transition-colors hover:bg-accent/45 hover:text-primary sm:px-8"
      >
        <DownloadIcon class="w-4 h-4 mr-3" />
        <span class="truncate text-xs">{{ file.name }}</span>
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
