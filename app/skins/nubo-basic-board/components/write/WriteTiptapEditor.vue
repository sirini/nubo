<template>
  <ClientOnly>
    <div v-if="ed" class="relative border rounded-lg">
      <div
        v-if="isUploading && profile === 'post'"
        class="absolute right-3 top-3 z-20 flex items-center gap-2 rounded-md border bg-background/95 px-3 py-2 text-xs shadow-sm"
      >
        <Spinner />
        이미지 업로드 중
      </div>
      <div class="p-2 border-b flex items-center flex-wrap gap-2">
        <Button
          size="sm"
          :variant="isBold ? 'secondary' : 'ghost'"
          class="cursor-pointer"
          aria-label="굵게"
          @click="toggleBold"
        >
          <BoldIcon class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="isItalic ? 'secondary' : 'ghost'"
          class="cursor-pointer"
          aria-label="기울임"
          @click="toggleItalic"
        >
          <Italic class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="isStrike ? 'secondary' : 'ghost'"
          class="cursor-pointer"
          aria-label="취소선"
          @click="toggleStrike()"
        >
          <Strikethrough class="w-4 h-4" />
        </Button>

        <div v-if="profile === 'post'" class="relative">
          <Button size="sm" variant="ghost" class="cursor-pointer" aria-label="글자 색상">
            <Palette class="w-4 h-4" />
            <input
              type="color"
              class="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              :value="getAttr('textStyle').color || '#000000'"
              aria-label="글자 색상 선택"
              @input="selectTextColor"
            />
          </Button>
        </div>

        <Select
          v-if="profile === 'post'"
          class="rounded-md bg-transparent p-2 text-sm hover:bg-accent"
          :model-value="edit.editorHeadings"
          @update:model-value="edit.toggleHeading"
        >
          <SelectTrigger class="w-24 cursor-pointer" aria-label="문단 스타일">
            <SelectValue placeholder="스타일" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="0" :selected="!edit.isHeadingActive()">본문</SelectItem>
              <SelectItem
                v-for="(_, index) in 4"
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
          class="cursor-pointer"
          aria-label="링크 추가"
          @click="isAddLinkDialog = true"
        >
          <Link class="w-4 h-4" />
        </Button>

        <Button
          v-if="profile === 'post'"
          size="sm"
          variant="ghost"
          class="cursor-pointer"
          aria-label="이미지 삽입"
          @click="isImageUploadDialog = true"
        >
          <Image class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="isBlockquote ? 'secondary' : 'ghost'"
          class="cursor-pointer"
          aria-label="인용구"
          @click="toggleBlockquote"
        >
          <Quote class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          :variant="isCode ? 'secondary' : 'ghost'"
          class="cursor-pointer"
          aria-label="인라인 코드"
          @click="toggleCode"
        >
          <CodeIcon class="w-4 h-4" />
        </Button>

        <Button
          v-if="profile === 'post'"
          size="sm"
          :variant="isCodeBlock ? 'secondary' : 'ghost'"
          class="cursor-pointer"
          aria-label="코드 블록"
          @click="toggleCodeBlock"
        >
          <SquareCode class="w-4 h-4" />
        </Button>

        <WriteTableMenu v-if="profile === 'post'" :editor="ed" />

        <div class="w-px h-6 bg-border mx-1"></div>

        <Button
          size="sm"
          variant="ghost"
          class="cursor-pointer"
          aria-label="실행 취소"
          @click="undo"
        >
          <Undo class="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          class="cursor-pointer"
          aria-label="다시 실행"
          @click="redo"
        >
          <Redo class="w-4 h-4" />
        </Button>
      </div>

      <EditorContent :editor="ed as unknown as Editor" class="tiptap p-4 focus:outline-none" />
      <WriteAddLink />
      <WriteImageUpload v-if="profile === 'post'" />
    </div>
    <Toaster />
  </ClientOnly>
</template>

<script setup lang="ts">
import "@/assets/css/editor.scss"
import { EditorContent } from "@tiptap/vue-3"
import type { Editor } from "@tiptap/vue-3"
import { toast } from "vue-sonner"
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
import type { EditorProfile } from "~/types/editor"
import { useNuboEditorContext } from "~/providers/contexts/editor"
import WriteAddLink from "./WriteAddLink.vue"
import WriteImageUpload from "./WriteImageUpload.vue"
import WriteTableMenu from "./WriteTableMenu.vue"

const edit = useEditorStore()
const props = withDefaults(
  defineProps<{ modelValue: string; config: BoardConfig; profile?: EditorProfile }>(),
  { profile: "post" },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()
const ed = shallowRef<Editor | null>(null)

// 화면이 준비되면 Tiptap 에디터 꺼내와서 준비
onMounted(() => {
  const editor = useTiptapEditor(toRef(props, "modelValue"), {
    profile: props.profile,
    onUpdate: (html) => emit("update:modelValue", html),
    onUploadImages: props.profile === "post" ? uploadEditorImages : undefined,
  })
  ed.value = editor

  edit.editor = editor
  edit.config = props.config
  syncBlockStyle()
  editor.on("selectionUpdate", syncBlockStyle)
  editor.on("transaction", syncBlockStyle)
})

const uploadEditorImages = async (files: File[]) => {
  const sources = await edit.uploadContentImages(files)
  if (sources.length > 0) toast(`✅ 본문에 이미지를 삽입하였습니다`)
  return sources
}

const syncBlockStyle = () => {
  if (!ed.value || props.profile !== "post") return
  const activeLevel = ([1, 2, 3, 4] as const).find((level) =>
    ed.value?.isActive("heading", { level }),
  )
  edit.editorHeadings = activeLevel ? String(activeLevel) : "0"
}

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

const {
  isBold,
  isItalic,
  isStrike,
  isBlockquote,
  isCode,
  isCodeBlock,
  isUploading,
  isAddLinkDialog,
  isImageUploadDialog,
  toggleBold,
  toggleItalic,
  toggleStrike,
  toggleBlockquote,
  toggleCode,
  toggleCodeBlock,
  undo,
  redo,
  getAttr,
  selectTextColor,
} = useNuboEditorContext()
</script>
