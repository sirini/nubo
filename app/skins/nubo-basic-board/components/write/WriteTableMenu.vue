<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        size="sm"
        :variant="isTableActive() ? 'secondary' : 'ghost'"
        class="cursor-pointer"
        aria-label="표 편집"
      >
        <Table2Icon class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-52">
      <DropdownMenuLabel>표</DropdownMenuLabel>
      <DropdownMenuItem class="cursor-pointer" @click="insertTable">
        <TablePropertiesIcon class="size-4" />
        3 × 3 표 삽입
      </DropdownMenuItem>

      <template v-if="isTableActive()">
        <DropdownMenuSeparator />
        <DropdownMenuLabel>행</DropdownMenuLabel>
        <DropdownMenuItem class="cursor-pointer" @click="addRowBefore">
          <Rows3Icon class="size-4" />
          위에 행 추가
        </DropdownMenuItem>
        <DropdownMenuItem class="cursor-pointer" @click="addRowAfter">
          <Rows3Icon class="size-4" />
          아래에 행 추가
        </DropdownMenuItem>
        <DropdownMenuItem class="cursor-pointer" @click="deleteRow">
          <Trash2Icon class="size-4" />
          현재 행 삭제
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>열</DropdownMenuLabel>
        <DropdownMenuItem class="cursor-pointer" @click="addColumnBefore">
          <Columns3Icon class="size-4" />
          왼쪽에 열 추가
        </DropdownMenuItem>
        <DropdownMenuItem class="cursor-pointer" @click="addColumnAfter">
          <Columns3Icon class="size-4" />
          오른쪽에 열 추가
        </DropdownMenuItem>
        <DropdownMenuItem class="cursor-pointer" @click="deleteColumn">
          <Trash2Icon class="size-4" />
          현재 열 삭제
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem class="cursor-pointer" @click="mergeOrSplit">
          <BetweenHorizontalEndIcon class="size-4" />
          셀 병합 또는 분할
        </DropdownMenuItem>
        <DropdownMenuItem class="cursor-pointer" @click="toggleHeaderRow">
          <PanelTopIcon class="size-4" />
          머리글 행 전환
        </DropdownMenuItem>
        <DropdownMenuItem
          class="cursor-pointer text-destructive focus:text-destructive"
          @click="deleteTable"
        >
          <Trash2Icon class="size-4" />
          표 삭제
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import type { Editor } from "@tiptap/vue-3"
import {
  BetweenHorizontalEndIcon,
  Columns3Icon,
  PanelTopIcon,
  Rows3Icon,
  Table2Icon,
  TablePropertiesIcon,
  Trash2Icon,
} from "lucide-vue-next"

const props = defineProps<{ editor: Editor }>()

const isTableActive = () => props.editor.isActive("table")
const insertTable = () =>
  props.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
const addRowBefore = () => props.editor.chain().focus().addRowBefore().run()
const addRowAfter = () => props.editor.chain().focus().addRowAfter().run()
const deleteRow = () => props.editor.chain().focus().deleteRow().run()
const addColumnBefore = () => props.editor.chain().focus().addColumnBefore().run()
const addColumnAfter = () => props.editor.chain().focus().addColumnAfter().run()
const deleteColumn = () => props.editor.chain().focus().deleteColumn().run()
const mergeOrSplit = () => props.editor.chain().focus().mergeOrSplit().run()
const toggleHeaderRow = () => props.editor.chain().focus().toggleHeaderRow().run()
const deleteTable = () => props.editor.chain().focus().deleteTable().run()
</script>
