import { Editor } from "@tiptap/vue-3"

// Tiptap Extensions
import Blockquote from "@tiptap/extension-blockquote"
import Bold from "@tiptap/extension-bold"
import BulletList from "@tiptap/extension-bullet-list"
import Code from "@tiptap/extension-code"
import CodeBlock from "@tiptap/extension-code-block"
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
import type { EditorProfile } from "~/types/editor"

// Tiptap 에디터 객체 반환
export const useTiptapEditor = (
  content: Ref<string>,
  profile: EditorProfile,
  onUpdate: (html: string) => void,
) => {
  const commonExtensions = [
    Bold,
    Blockquote,
    BulletList,
    Document,
    HardBreak,
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
    TiptapLink.configure({ openOnClick: false }),
    Typography,
  ]

  const postExtensions = [
    Heading.configure({ levels: [1, 2, 3, 4] }),
    HorizontalRule,
    Highlight,
    TiptapImage.configure({ inline: true }),
    Youtube,
    Color,
    TextStyle,
    Table.configure({ resizable: true }),
    TableCell,
    TableHeader,
    TableRow,
    CodeBlock.configure({ defaultLanguage: "typescript" }),
  ]

  const extensions =
    profile === "post" ? [...commonExtensions, ...postExtensions] : commonExtensions

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
