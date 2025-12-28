import { Editor } from "@tiptap/vue-3"

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

// Tiptap 에디터 객체 반환
export const useTiptapEditor = (content: Ref<string>, onUpdate: (html: string) => void) => {
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

  const extensions = [
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
  ]

  const editor = new Editor({
    content: content.value,
    extensions,
    editorProps: {
      attributes: { class: "prose max-w-none" },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
  })
  return editor
}
