<template>
  <ClientOnly>
    <div v-if="ed" class="border rounded-lg">
      <div class="p-2 border-b flex items-center flex-wrap gap-2">
        <Button
          size="sm"
          :variant="ed.isActive('bold') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleBold().run()"
          class="cursor-pointer"
        >
          <BoldIcon class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="ed.isActive('italic') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleItalic().run()"
          class="cursor-pointer"
        >
          <Italic class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="ed.isActive('strike') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleStrike().run()"
          class="cursor-pointer"
        >
          <Strikethrough class="w-4 h-4" />
        </Button>

        <div class="relative">
          <Button size="sm" variant="ghost" class="cursor-pointer">
            <Palette class="w-4 h-4" />
            <input
              type="color"
              class="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              @input="edit.selectColor($event)"
              :value="ed.getAttributes('textStyle').color || '#000000'"
            />
          </Button>
        </div>

        <Select
          class="p-2 text-sm bg-transparent rounded-md hover:bg-white/10"
          @update:model-value="edit.toggleHeading"
          :model-value="edit.editorHeadings"
        >
          <SelectTrigger class="w-24 cursor-pointer">
            <SelectValue placeholder="스타일" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="0" :selected="!edit.isHeadingActive()">본문</SelectItem>
              <SelectItem
                v-for="(_, index) in 6"
                :key="index"
                :value="index + 1"
                :selected="ed.isActive('heading', { level: index + 1 })"
                >H{{ index + 1 }}</SelectItem
              >
            </SelectGroup>
          </SelectContent>
        </Select>

        <div class="w-px h-6 bg-border mx-1"></div>

        <Button
          size="sm"
          variant="ghost"
          @click="edit.isAddLinkDialog = true"
          class="cursor-pointer"
        >
          <Link class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          @click="edit.isImageUploadDialog = true"
          class="cursor-pointer"
        >
          <Image class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="ed.isActive('blockquote') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleBlockquote().run()"
          class="cursor-pointer"
        >
          <Quote class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="ed.isActive('code') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleCode().run()"
          class="cursor-pointer"
        >
          <CodeIcon class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="ed.isActive('codeBlock') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleCodeBlock().run()"
          class="cursor-pointer"
        >
          <SquareCode class="w-4 h-4" />
        </Button>

        <div class="w-px h-6 bg-border mx-1"></div>

        <Button
          size="sm"
          variant="ghost"
          @click="ed.chain().focus().undo().run()"
          class="cursor-pointer"
        >
          <Undo class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          @click="ed.chain().focus().redo().run()"
          class="cursor-pointer"
        >
          <Redo class="w-4 h-4" />
        </Button>
      </div>

      <EditorContent :editor="ed as unknown as Editor" class="tiptap p-4 focus:outline-none" />
      <EditorAddLink />
      <EditorImageUpload />
    </div>
    <Toaster />
  </ClientOnly>
</template>

<script setup lang="ts">
import "@/assets/css/editor.scss"
import { Editor, EditorContent, type Editor as EditorClass } from "@tiptap/vue-3"
import {
  Bold as BoldIcon,
  CodeIcon,
  Image,
  Italic,
  Link,
  Palette,
  Quote,
  Redo,
  SquareCode,
  Strikethrough,
  Undo,
} from "lucide-vue-next"
import type { BoardConfig } from "~/types/board"
import EditorAddLink from "./EditorAddLink.vue"
import EditorImageUpload from "./EditorImageUpload.vue"

const edit = useEditorStore()
const props = defineProps<{ modelValue: string; config: BoardConfig }>()
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()
const ed = ref<EditorClass | null>(null)

// 화면이 준비되면 Tiptap 에디터 꺼내와서 준비
onMounted(() => {
  ed.value = useTiptapEditor(toRef(props, "modelValue"), (html) => {
    emit("update:modelValue", html)
  })

  edit.editor = ed.value
  edit.config = props.config
})

// 에디터에 연결된 변수값이 업데이트 되면 에디터에서도 맞춰서 변경해주기
watch(
  () => props.modelValue,
  (value) => {
    if (ed.value && value !== ed.value.getHTML()) {
      ed.value.commands.setContent(value, { emitUpdate: false })
    }
  },
)

// 화면을 나가기 전에 에디터가 사용한 리소스 다시 회수하기
onBeforeUnmount(() => {
  ed.value?.destroy()
})
</script>
