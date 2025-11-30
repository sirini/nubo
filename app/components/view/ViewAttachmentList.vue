<template>
  <Collapsible
    v-if="board.view.files.length > 0"
    v-model:open="board.isFileListOpen"
    class="p-3 border rounded-md mx-3"
  >
    <div class="flex items-center justify-between w-full px-1 cursor-pointer">
      <h4 class="text-sm font-semibold" @click="board.isFileListOpen = !board.isFileListOpen">
        첨부파일 목록
      </h4>
      <CollapsibleTrigger as-child>
        <Button variant="ghost" size="sm" class="p-0 cursor-pointer">
          <ChevronsUpDownIcon class="h-4 w-4" />
          <span class="sr-only">토글</span>
        </Button>
      </CollapsibleTrigger>
    </div>
    <CollapsibleContent class="pt-2 space-y-2">
      <div
        v-for="(file, index) in board.view.files"
        :key="index"
        class="rounded-md border px-4 py-3 font-code text-sm inline-flex items-center w-full cursor-pointer"
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
import { ChevronsUpDownIcon, DownloadIcon } from "lucide-vue-next"
import { num } from "~/lib/utils"

const board = useBoardStore()
</script>
