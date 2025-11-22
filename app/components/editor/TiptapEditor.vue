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
          :model-value="edit.headingLevel"
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

      <EditorContent
        :editor="ed as unknown as Editor"
        class="nubo p-4 min-h-60 focus:outline-none"
      />
      <editor-add-link />
      <editor-image-upload />
    </div>
    <Toaster />
  </ClientOnly>
</template>

<script setup lang="ts">
import { useEditorStore } from "#imports"
import "@/assets/css/editor.scss"
import { Editor, EditorContent, type Editor as EditorClass } from "@tiptap/vue-3"
import { onBeforeUnmount, onMounted, ref, watch } from "vue"

// Shadcn-vue & lucide-vue-next
import { Button } from "@/components/ui/button"
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

// Tiptap Extensions
import Blockquote from "@tiptap/extension-blockquote"
import Bold from "@tiptap/extension-bold"
import BulletList from "@tiptap/extension-bullet-list"
import Code from "@tiptap/extension-code"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { Color } from "@tiptap/extension-color"
import Document from "@tiptap/extension-document"
import Dropcursor from "@tiptap/extension-dropcursor"
import Gapcursor from "@tiptap/extension-gapcursor"
import HardBreak from "@tiptap/extension-hard-break"
import Heading from "@tiptap/extension-heading"
import Highlight from "@tiptap/extension-highlight"
import History from "@tiptap/extension-history"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import TiptapImage from "@tiptap/extension-image"
import ItalicExt from "@tiptap/extension-italic"
import TiptapLink from "@tiptap/extension-link"
import ListItem from "@tiptap/extension-list-item"
import OrderedList from "@tiptap/extension-ordered-list"
import Paragraph from "@tiptap/extension-paragraph"
import StrikeExt from "@tiptap/extension-strike"
import { Table } from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import Text from "@tiptap/extension-text"
import { TextStyle } from "@tiptap/extension-text-style"
import Typography from "@tiptap/extension-typography"
import Youtube from "@tiptap/extension-youtube"

// Highlight.js
import cpp from "highlight.js/lib/languages/cpp"
import css from "highlight.js/lib/languages/css"
import go from "highlight.js/lib/languages/go"
import java from "highlight.js/lib/languages/java"
import js from "highlight.js/lib/languages/javascript"
import kt from "highlight.js/lib/languages/kotlin"
import php from "highlight.js/lib/languages/php"
import py from "highlight.js/lib/languages/python"
import rs from "highlight.js/lib/languages/rust"
import ts from "highlight.js/lib/languages/typescript"
import { all, createLowlight } from "lowlight"
import type { BoardConfig } from "~/types/board"

// Props & Emits
const props = defineProps<{
  modelValue: string
  config: BoardConfig
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const ed = ref<EditorClass | null>(null)
const lowlight = createLowlight(all)
lowlight.register("css", css)
lowlight.register("js", js)
lowlight.register("ts", ts)
lowlight.register("py", py)
lowlight.register("kt", kt)
lowlight.register("java", java)
lowlight.register("cpp", cpp)
lowlight.register("php", php)
lowlight.register("rs", rs)
lowlight.register("go", go)

const edit = useEditorStore()

onMounted(() => {
  ed.value = new Editor({
    content: props.modelValue || "",
    extensions: [
      Bold,
      Blockquote,
      BulletList,
      Document,
      HardBreak,
      Heading.configure({ levels: [1, 2, 3, 4] }),
      HorizontalRule,
      ListItem,
      OrderedList,
      Paragraph,
      Text,
      Code,
      ItalicExt,
      StrikeExt,
      Dropcursor,
      Gapcursor,
      History,
      Highlight,
      TiptapImage.configure({ inline: true }),
      Youtube,
      Color,
      TextStyle,
      Table.configure({ resizable: true }),
      TableCell,
      TableHeader,
      TableRow,
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "typescript" }),
      TiptapLink.configure({ openOnClick: false }),
      Typography,
    ],
    editorProps: {
      attributes: {
        class: "prose max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      emit("update:modelValue", editor.getHTML())
    },
  })

  edit.editor = ed.value
  edit.config = props.config
})

watch(
  () => props.modelValue,
  (value) => {
    if (ed.value && value !== ed.value.getHTML()) {
      ed.value.commands.setContent(value, { emitUpdate: false })
    }
  },
)

onBeforeUnmount(() => {
  ed.value?.destroy()
})
</script>
