<template>
  <ClientOnly>
    <div v-if="ed" class="border rounded-lg">
      <div class="p-2 border-b flex items-center flex-wrap gap-2">
        <Button
          size="sm"
          :variant="ed.isActive('bold') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleBold().run()"
        >
          <BoldIcon class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="ed.isActive('italic') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleItalic().run()"
        >
          <Italic class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="ed.isActive('strike') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleStrike().run()"
        >
          <Strikethrough class="w-4 h-4" />
        </Button>

        <div class="relative">
          <Button size="sm" variant="ghost">
            <Palette class="w-4 h-4" />
            <input
              type="color"
              class="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              @input="edit.selectColor($event)"
              :value="ed.getAttributes('textStyle').color || '#000000'"
            />
          </Button>
        </div>

        <select
          class="p-2 text-sm bg-transparent rounded-md hover:bg-muted"
          @change="edit.toggleHeading($event)"
        >
          <option value="0" :selected="!edit.isHeadingActive()">본문</option>
          <option value="1" :selected="ed.isActive('heading', { level: 1 })">H1</option>
          <option value="2" :selected="ed.isActive('heading', { level: 2 })">H2</option>
          <option value="3" :selected="ed.isActive('heading', { level: 3 })">H3</option>
          <option value="3" :selected="ed.isActive('heading', { level: 4 })">H4</option>
        </select>

        <div class="w-[1px] h-6 bg-border mx-1"></div>

        <Button size="sm" variant="ghost" @click="edit.setLink">
          <Link class="w-4 h-4" />
        </Button>

        <Button size="sm" variant="ghost" @click="edit.uploadImages">
          <Image class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="ed.isActive('blockquote') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleBlockquote().run()"
        >
          <Quote class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="ed.isActive('codeBlock') ? 'secondary' : 'ghost'"
          @click="ed.chain().focus().toggleCodeBlock().run()"
        >
          <Codepen class="w-4 h-4" />
        </Button>

        <div class="w-[1px] h-6 bg-border mx-1"></div>

        <Button size="sm" variant="ghost" @click="ed.chain().focus().undo().run()">
          <Undo class="w-4 h-4" />
        </Button>

        <Button size="sm" variant="ghost" @click="ed.chain().focus().redo().run()">
          <Redo class="w-4 h-4" />
        </Button>
      </div>

      <EditorContent
        :editor="ed as unknown as Editor"
        class="p-4 min-h-[250px] focus:outline-none"
      />
      <editor-image-upload />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useEditorStore } from "#imports"
import { Editor, EditorContent, type Editor as EditorClass } from "@tiptap/vue-3"
import { onBeforeUnmount, onMounted, ref, watch } from "vue"

// Shadcn-vue & lucide-vue-next
import { Button } from "@/components/ui/button"
import {
  Bold as BoldIcon,
  Image,
  Italic,
  Link,
  Palette,
  Quote,
  Redo,
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

// Props & Emits
const props = defineProps<{
  modelValue: string
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
