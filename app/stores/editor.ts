import type { Editor } from "@tiptap/vue-3"
import { defineStore } from "pinia"
import type { AcceptableValue } from "reka-ui"
import { ref } from "vue"
import { toast } from "vue-sonner"
import { BOARD_CONFIG, type BoardConfig } from "~/types/board"
import type { HeadingLevel } from "~/types/editor"

export const useEditorStore = defineStore("editor", () => {
  const auth = useAuthStore()
  const { uploadEditorImages } = useEditor()
  const isUploading = ref<boolean>(false)
  const isImageUploadDialog = ref<boolean>(false)
  const isAddLinkDialog = ref<boolean>(false)
  const boardConfig = ref<BoardConfig>(BOARD_CONFIG)
  const editor = ref<Editor | null>(null)
  const files = ref<File[]>([])
  const previewImages = ref<string[]>([])
  const runtimeConfig = useRuntimeConfig()
  const headingLevel = ref<string>("")
  const content = ref<string>("")

  // 글자 색상 변경하기
  function selectColor(event: Event): void {
    const target = event.target as HTMLInputElement
    if (target && editor.value) {
      editor.value.chain().focus().setColor(target.value).run()
    }
  }

  // 링크 설정하기
  function setLink(url: string): void {
    if (!editor.value) return
    if (url === "") {
      editor.value.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.value.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  // 헤딩 선택하기
  function toggleHeading(value: AcceptableValue): void {
    let level: HeadingLevel | undefined

    if (typeof value === "string") {
      const parsed = parseInt(value, 10)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
        level = parsed as HeadingLevel
      }
    } else if (typeof value === "number") {
      if (value >= 1 && value <= 6) {
        level = value as HeadingLevel
      }
    }

    if (!editor.value || level === undefined) {
      return
    }

    editor.value.chain().focus().toggleHeading({ level }).run()
  }

  // 헤딩이 선택되었는지 확인하기
  function isHeadingActive(): boolean {
    if (!editor.value) return false

    return (
      editor.value.isActive("heading", { level: 1 }) ||
      editor.value.isActive("heading", { level: 2 }) ||
      editor.value.isActive("heading", { level: 3 }) ||
      editor.value.isActive("heading", { level: 4 })
    )
  }

  // 선택한 이미지 파일들을 미리 보여주기
  function selectedFiles(event: MouseEvent): void {
    previewImages.value.forEach((url) => URL.revokeObjectURL(url))
    previewImages.value = []
    files.value = []

    const targets = (event?.target as HTMLInputElement).files
    if (!targets) {
      return
    }

    let totalSize = 0
    const arr = Array.from(targets)
    for (const target of arr) {
      totalSize += target.size
      if (totalSize > parseInt(runtimeConfig.public.fileSize)) {
        toast(`파일 크기 제한을 초과하였습니다: ${totalSize} > ${runtimeConfig.public.fileSize}`)
        break
      }
      files.value.push(target)
      previewImages.value.push(URL.createObjectURL(target))
    }
    toast(`업로드 버튼을 클릭하셔야 파일이 올라갑니다`)
  }

  // 선택된 이미지 파일들 업로드하고 작성란에 추가하기
  async function uploadingFiles(): Promise<void> {
    try {
      isUploading.value = true
      const response = await uploadEditorImages(auth.user.token, boardConfig.value.uid, files.value)
      if (!response.success) {
        toast(`업로드 실패: ${response.error}`)
      }
    } catch (e) {
      toast(`이미지 파일 업로드에 실패하였습니다: ${e}`)
    } finally {
      isUploading.value = false
      files.value = []
    }
  }

  return {
    isUploading,
    isImageUploadDialog,
    isAddLinkDialog,
    boardConfig,
    editor,
    files,
    previewImages,
    headingLevel,
    content,

    selectColor,
    setLink,
    toggleHeading,
    isHeadingActive,
    selectedFiles,
    uploadingFiles,
  }
})
