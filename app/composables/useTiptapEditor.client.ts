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
import { Markdown } from "@tiptap/markdown"
import type { EditorProfile } from "~/types/editor"

type TiptapEditorOptions = {
  profile: EditorProfile
  onUpdate: (html: string) => void
  onUploadImages?: (files: File[]) => Promise<string[]>
}

const getClipboardImages = (data: DataTransfer | null) => {
  if (!data) return []
  const files = Array.from(data.files).filter((file) => file.type.startsWith("image/"))
  if (files.length > 0) return files

  return Array.from(data.items)
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
}

export const looksLikeMarkdown = (text: string) => {
  const value = text.trim()
  if (!value) return false

  const blockSyntax = [
    /^#{1,6}\s+\S/m,
    /^>\s+\S/m,
    /^\s*[-+*]\s+\S/m,
    /^\s*\d+[.)]\s+\S/m,
    /^```[\w-]*\s*$/m,
    /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/m,
    /^\|?.+\|.+\|?\s*\n\|?\s*:?-{3,}:?\s*\|/m,
  ]
  const inlineSyntax = [
    /(?:\*\*|__)(?=\S)[\s\S]*?\S(?:\*\*|__)/,
    /~~(?=\S)[\s\S]*?\S~~/,
    /!?\[[^\]\n]+\]\([^\s)]+(?:\s+["'][^"']*["'])?\)/,
    /(^|[^`])`[^`\n]+`([^`]|$)/,
  ]

  return blockSyntax.some((pattern) => pattern.test(value)) || inlineSyntax.some((pattern) => pattern.test(value))
}

// Tiptap 에디터 객체 반환
export const useTiptapEditor = (
  content: Ref<string>,
  { profile, onUpdate, onUploadImages }: TiptapEditorOptions,
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
    Markdown.configure({ markedOptions: { gfm: true } }),
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

  const uploadAndInsertImages = async (files: File[], position: number) => {
    if (!onUploadImages) return
    const urls = await onUploadImages(files)
    if (urls.length < 1 || editor.isDestroyed) return

    const safePosition = Math.min(position, editor.state.doc.content.size)
    editor.commands.insertContentAt(
      safePosition,
      urls.map((src) => ({ type: "image", attrs: { src } })),
    )
  }

  const editor = new Editor({
    content: content.value,
    extensions,
    editorProps: {
      attributes: { class: "prose max-w-none" },
      handlePaste: (view, event) => {
        const images = getClipboardImages(event.clipboardData)
        if (images.length > 0 && onUploadImages) {
          event.preventDefault()
          void uploadAndInsertImages(images, view.state.selection.from)
          return true
        }

        const text = event.clipboardData?.getData("text/plain")
        if (!text || !looksLikeMarkdown(text)) return false
        const content = editor.markdown?.parse(text)
        if (!content) return false

        event.preventDefault()
        editor.commands.insertContent(content)
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !onUploadImages) return false
        const images = getClipboardImages(event.dataTransfer)
        if (images.length < 1) return false

        event.preventDefault()
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        void uploadAndInsertImages(images, position ?? view.state.selection.from)
        return true
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
  })
  return editor
}
