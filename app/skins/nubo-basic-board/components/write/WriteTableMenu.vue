<template>
  <DropdownMenu>
    <CommonVTooltip content="표를 삽입하거나 현재 표를 편집합니다">
      <DropdownMenuTrigger as-child>
        <Button
          size="sm"
          :variant="isTableActive() ? 'secondary' : 'ghost'"
          class="cursor-pointer"
          aria-label="표 삽입 및 편집"
        >
          <Table2Icon class="size-4" />
        </Button>
      </DropdownMenuTrigger>
    </CommonVTooltip>
    <DropdownMenuContent align="start" class="w-52">
      <DropdownMenuLabel>표</DropdownMenuLabel>
      <DropdownMenuItem
        class="cursor-pointer"
        :disabled="isTableActive()"
        @click="insertTable"
      >
        <TablePropertiesIcon class="size-4" />
        3 × 3 표 삽입
      </DropdownMenuItem>
      <p v-if="!isTableActive()" class="px-2 py-1.5 text-xs text-muted-foreground">
        표의 셀을 선택하면 아래 편집 기능을 사용할 수 있습니다.
      </p>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>행</DropdownMenuLabel>
      <DropdownMenuItem
        class="cursor-pointer"
        :disabled="!isTableActive()"
        @click="addRowBefore"
      >
        <Rows3Icon class="size-4" />
        위에 행 추가
      </DropdownMenuItem>
      <DropdownMenuItem
        class="cursor-pointer"
        :disabled="!isTableActive()"
        @click="addRowAfter"
      >
        <Rows3Icon class="size-4" />
        아래에 행 추가
      </DropdownMenuItem>
      <DropdownMenuItem
        class="cursor-pointer"
        :disabled="!isTableActive()"
        @click="deleteRow"
      >
        <Trash2Icon class="size-4" />
        현재 행 삭제
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>열</DropdownMenuLabel>
      <DropdownMenuItem
        class="cursor-pointer"
        :disabled="!isTableActive()"
        @click="addColumnBefore"
      >
        <Columns3Icon class="size-4" />
        왼쪽에 열 추가
      </DropdownMenuItem>
      <DropdownMenuItem
        class="cursor-pointer"
        :disabled="!isTableActive()"
        @click="addColumnAfter"
      >
        <Columns3Icon class="size-4" />
        오른쪽에 열 추가
      </DropdownMenuItem>
      <DropdownMenuItem
        class="cursor-pointer"
        :disabled="!isTableActive()"
        @click="deleteColumn"
      >
        <Trash2Icon class="size-4" />
        현재 열 삭제
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="cursor-pointer"
        :disabled="!isTableActive()"
        @click="mergeOrSplit"
      >
        <BetweenHorizontalEndIcon class="size-4" />
        셀 병합 또는 분할
      </DropdownMenuItem>
      <DropdownMenuItem
        class="cursor-pointer"
        :disabled="!isTableActive()"
        @click="toggleHeaderRow"
      >
        <PanelTopIcon class="size-4" />
        머리글 행 전환
      </DropdownMenuItem>
      <DropdownMenuItem
        class="cursor-pointer text-destructive focus:text-destructive"
        :disabled="!isTableActive()"
        @click="deleteTable"
      >
        <Trash2Icon class="size-4" />
        표 삭제
      </DropdownMenuItem>
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
