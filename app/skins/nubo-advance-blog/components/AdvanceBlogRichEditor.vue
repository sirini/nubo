<template>
  <ClientOnly>
    <div v-if="editor" class="overflow-hidden rounded-2xl border border-border/70 bg-background">
      <div
        class="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b border-border/60 bg-background/90 p-2 backdrop-blur"
      >
        <select
          v-model="headingStyle"
          class="h-9 cursor-pointer rounded-md border border-input bg-background px-2 text-xs"
          aria-label="문단 스타일"
          @change="setHeadingStyle(headingStyle)"
        >
          <option value="0">본문</option>
          <option value="1">제목 1</option>
          <option value="2">제목 2</option>
          <option value="3">제목 3</option>
        </select>
        <Button
          type="button"
          size="icon"
          :variant="active('bold') ? 'secondary' : 'ghost'"
          aria-label="굵게"
          @click="toggleBold"
          ><BoldIcon class="size-4"
        /></Button>
        <Button
          type="button"
          size="icon"
          :variant="active('italic') ? 'secondary' : 'ghost'"
          aria-label="기울임"
          @click="toggleItalic"
          ><ItalicIcon class="size-4"
        /></Button>
        <Button
          type="button"
          size="icon"
          :variant="active('strike') ? 'secondary' : 'ghost'"
          aria-label="취소선"
          @click="toggleStrike"
          ><StrikethroughIcon class="size-4"
        /></Button>
        <Button
          type="button"
          size="icon"
          :variant="active('blockquote') ? 'secondary' : 'ghost'"
          aria-label="인용문"
          @click="toggleBlockquote"
          ><QuoteIcon class="size-4"
        /></Button>
        <Button
          type="button"
          size="icon"
          :variant="active('bulletList') ? 'secondary' : 'ghost'"
          aria-label="글머리 목록"
          @click="editor.chain().focus().toggleBulletList().run()"
          ><ListIcon class="size-4"
        /></Button>
        <Button
          type="button"
          size="icon"
          :variant="active('orderedList') ? 'secondary' : 'ghost'"
          aria-label="번호 목록"
          @click="editor.chain().focus().toggleOrderedList().run()"
          ><ListOrderedIcon class="size-4"
        /></Button>
        <Button
          type="button"
          size="icon"
          :variant="active('codeBlock') ? 'secondary' : 'ghost'"
          aria-label="코드 블록"
          @click="toggleCodeBlock"
          ><SquareCodeIcon class="size-4"
        /></Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="링크 설정"
          @click="showLink = !showLink"
          ><LinkIcon class="size-4"
        /></Button>
        <label
          class="inline-flex size-9 cursor-pointer items-center justify-center rounded-md hover:bg-accent"
          :class="isUploading ? 'pointer-events-none opacity-50' : ''"
          aria-label="본문 이미지 삽입"
          ><LoaderCircleIcon v-if="isUploading" class="size-4 animate-spin" /><ImagePlusIcon
            v-else
            class="size-4" /><input
            class="sr-only"
            type="file"
            accept="image/*"
            multiple
            :disabled="isUploading"
            @change="insertSelectedImages"
        /></label>
        <span class="mx-1 h-5 w-px bg-border"></span>
        <Button type="button" size="icon" variant="ghost" aria-label="실행 취소" @click="undo"
          ><Undo2Icon class="size-4"
        /></Button>
        <Button type="button" size="icon" variant="ghost" aria-label="다시 실행" @click="redo"
          ><Redo2Icon class="size-4"
        /></Button>
      </div>
      <div v-if="showLink" class="flex gap-2 border-b border-border/60 bg-muted/20 p-3">
        <Input
          v-model="linkUrl"
          type="url"
          placeholder="https://example.com"
          aria-label="링크 주소"
          @keyup.enter.prevent="applyLink"
        /><Button type="button" variant="outline" @click="applyLink">적용</Button
        ><Button type="button" variant="ghost" @click="removeLink">해제</Button>
      </div>
      <EditorContent
        :editor="editor"
        class="advance-blog-editor min-h-[28rem] px-5 py-7 focus:outline-none sm:px-8"
      />
    </div>
    <template #fallback
      ><div
        class="flex min-h-[28rem] items-center justify-center rounded-2xl border border-border/70 text-sm text-muted-foreground"
      >
        <LoaderCircleIcon class="mr-2 size-4 animate-spin" />편집기를 준비하고 있습니다
      </div></template
    >
  </ClientOnly>
</template>

<script setup lang="ts">
import "@/assets/css/editor.scss"
import { EditorContent, type Editor } from "@tiptap/vue-3"
import {
  BoldIcon,
  ImagePlusIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  LoaderCircleIcon,
  QuoteIcon,
  Redo2Icon,
  SquareCodeIcon,
  StrikethroughIcon,
  Undo2Icon,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import { useNuboEditorContext } from "~/providers/contexts/editor"
import type { BoardConfig } from "~/types/board"

const props = defineProps<{ modelValue: string; config: BoardConfig }>()
const emit = defineEmits<{ (event: "update:modelValue", value: string): void }>()
const editor = shallowRef<Editor | null>(null)
const showLink = ref(false)
const linkUrl = ref("")
const toolbarRevision = ref(0)
const {
  bindEditor,
  headingStyle,
  insertImageToEditor,
  isUploading,
  redo,
  setHeadingStyle,
  setLink,
  toggleBlockquote,
  toggleBold,
  toggleCodeBlock,
  toggleItalic,
  toggleStrike,
  undo,
  uploadContentImages,
} = useNuboEditorContext()

const uploadImages = async (files: File[]) => {
  const sources = await uploadContentImages(files)
  if (sources.length) toast("✅ 본문에 이미지를 삽입했습니다")
  return sources
}
const syncToolbar = () => {
  toolbarRevision.value++
  const level = ([1, 2, 3] as const).find((item) =>
    editor.value?.isActive("heading", { level: item }),
  )
  headingStyle.value = level ? String(level) : "0"
}
const active = (name: string) => {
  void toolbarRevision.value
  return editor.value?.isActive(name) || false
}
const insertSelectedImages = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const sources = await uploadImages(Array.from(input.files || []))
  sources.forEach(insertImageToEditor)
  input.value = ""
}
const applyLink = () => {
  setLink(linkUrl.value.trim())
  showLink.value = false
}
const removeLink = () => {
  setLink("")
  linkUrl.value = ""
  showLink.value = false
}

onMounted(() => {
  const instance = useTiptapEditor(toRef(props, "modelValue"), {
    profile: "post",
    onUpdate: (html) => emit("update:modelValue", html),
    onUploadImages: uploadImages,
  })
  editor.value = instance
  bindEditor(instance, props.config)
  instance.on("selectionUpdate", syncToolbar)
  instance.on("transaction", syncToolbar)
  syncToolbar()
})
watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && value !== editor.value.getHTML())
      editor.value.commands.setContent(value, { emitUpdate: false })
  },
)
onBeforeUnmount(() => {
  editor.value?.destroy()
  bindEditor(null)
})
</script>

<style scoped>
.advance-blog-editor :deep(.tiptap) {
  min-height: 25rem;
  outline: none;
  font-size: 1.08rem;
  line-height: 1.9;
}
.advance-blog-editor :deep(.tiptap p) {
  margin-block: 0.9em;
}
.advance-blog-editor :deep(.tiptap h1),
.advance-blog-editor :deep(.tiptap h2),
.advance-blog-editor :deep(.tiptap h3) {
  margin-top: 1.8em;
  letter-spacing: -0.035em;
  line-height: 1.3;
}
.advance-blog-editor :deep(.tiptap img) {
  margin: 1.5rem auto;
  max-height: 70dvh;
  border-radius: 0.75rem;
  object-fit: contain;
}
</style>
