<template>
  <ClientOnly>
    <EditorContent
      v-if="ed"
      :editor="ed as unknown as Editor"
      class="border rounded-lg p-2 min-h-[200px]"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
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
import Image from "@tiptap/extension-image"
import Italic from "@tiptap/extension-italic"
import Link from "@tiptap/extension-link"
import ListItem from "@tiptap/extension-list-item"
import OrderedList from "@tiptap/extension-ordered-list"
import Paragraph from "@tiptap/extension-paragraph"
import Strike from "@tiptap/extension-strike"
import { Table } from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import Text from "@tiptap/extension-text"
import { TextStyle } from "@tiptap/extension-text-style"
import Typography from "@tiptap/extension-typography"
import Youtube from "@tiptap/extension-youtube"
import { Editor, EditorContent } from "@tiptap/vue-3"
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
import { onBeforeUnmount, onMounted, ref, watch } from "vue"

// 부모 컨테이터에게 v-model 받기
const props = defineProps<{
  modelValue: string
}>()

// 부모에게 에디터 내용 업데이트 알리는 이벤트 정의
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const ed = ref<Editor | null>(null)
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

onMounted(() => {
  ed.value = new Editor({
    content: props.modelValue || "",
    extensions: [
      Blockquote,
      BulletList,
      Document,
      HardBreak,
      Heading,
      HorizontalRule,
      ListItem,
      OrderedList,
      Paragraph,
      Text,
      Bold,
      Code,
      Italic,
      Strike,
      Dropcursor,
      Gapcursor,
      History,
      Highlight,
      Image.configure({ inline: true }),
      Youtube,
      Color,
      TextStyle,
      Table.configure({
        resizable: true,
      }),
      TableCell,
      TableHeader,
      TableRow,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "typescript",
      }),
      Link,
      Typography,
    ],
    onUpdate: ({ editor }) => {
      emit("update:modelValue", editor.getHTML()) // 부모 컨테이너에게 내용 전달
    },
  })
})

// props가 바뀌면 에디터 내용도 갱신
watch(
  () => props.modelValue,
  (value) => {
    if (ed.value && value !== ed.value.getHTML()) {
      ed.value.commands.setContent(value, { emitUpdate: false })
    }
  },
)

// 에디터 리소스 해제
onBeforeUnmount(() => {
  ed.value?.destroy()
})
</script>
