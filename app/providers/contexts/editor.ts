import type { BoardConfig } from "~/types/board"
import type { Pair } from "~/types/common"
import type { EditorInsertImageResult } from "~/types/editor"

// [에디터] 에 필요한 변수 & 함수들 정의
export interface NuboEditorContext {
  config: ComputedRef<BoardConfig>
  content: ComputedRef<string>
  isAddLinkDialog: WritableComputedRef<boolean>
  isImageUploadDialog: WritableComputedRef<boolean>
  isUploading: ComputedRef<boolean>
  imageSizeLimit: ComputedRef<{ profile: string; contentInsert: string; thumbnail: string }>
  previewInsertImages: ComputedRef<string[]>
  insertedImages: ComputedRef<Pair[]>
  insertedImageResult: ComputedRef<EditorInsertImageResult | null>
  imageUrl: ComputedRef<string>
  isBold: ComputedRef<boolean | undefined>
  isItalic: ComputedRef<boolean | undefined>
  isStrike: ComputedRef<boolean | undefined>
  isBlockquote: ComputedRef<boolean | undefined>
  isCode: ComputedRef<boolean | undefined>
  isCodeBlock: ComputedRef<boolean | undefined>
  setLink: (url: string) => void
  loadInsertedImages: (opt?: { reset: boolean } | undefined) => void
  uploadingImages: () => Promise<void>
  insertImageToEditor: (src: string) => void
  deleteInsertedImage: (imageUid: number) => Promise<void>
  toggleBold: () => boolean
  toggleItalic: () => boolean
  toggleStrike: () => boolean
  toggleBlockquote: () => boolean
  toggleCode: () => boolean
  toggleCodeBlock: () => boolean
  undo: () => boolean
  redo: () => boolean
  getAttr: (name: string) => Record<string, any>
  selectTextColor: (event: Event) => void
}

export const nuboEditorKey: InjectionKey<NuboEditorContext> = Symbol("nuboEditorContext")

// [에디터] 에 필요한 변수 & 함수들 가져오기
export const useNuboEditorContext = () => {
  const context = inject(nuboEditorKey)
  if (!context) {
    throw new Error("useNuboEditorContext must be used within a proper provider")
  }
  return context
}
