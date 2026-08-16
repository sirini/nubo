import type { BoardConfig } from "~/types/board"
import type { Pair } from "~/types/common"
import type { EditorInsertImageResult } from "~/types/editor"

// [에디터] 에 필요한 변수 & 함수들 정의
export interface NuboEditorContext {
  config: ComputedRef<BoardConfig>
  content: ComputedRef<string>
  imageSizeLimit: ComputedRef<{ profile: string; contentInsert: string; thumbnail: string }>
  imageUrl: ComputedRef<string>
  insertedImageResult: ComputedRef<EditorInsertImageResult | null>
  insertedImages: ComputedRef<Pair[]>
  isAddLinkDialog: WritableComputedRef<boolean>
  isBlockquote: ComputedRef<boolean | undefined>
  isBold: ComputedRef<boolean | undefined>
  isCode: ComputedRef<boolean | undefined>
  isCodeBlock: ComputedRef<boolean | undefined>
  isImageUploadDialog: WritableComputedRef<boolean>
  isItalic: ComputedRef<boolean | undefined>
  isLoadDraft: ComputedRef<boolean>
  isStrike: ComputedRef<boolean | undefined>
  isUploading: ComputedRef<boolean>
  lastDraftSavedAt: ComputedRef<number>
  previewInsertImages: ComputedRef<string[]>
  deleteInsertedImage: (imageUid: number) => Promise<void>
  getAttr: (name: string) => Record<string, string | number | boolean | null | undefined>
  insertImageToEditor: (src: string) => void
  loadDraft: () => void
  loadInsertedImages: (opt?: { reset: boolean } | undefined) => void
  redo: () => boolean
  selectTextColor: (event: Event) => void
  setLink: (url: string) => void
  toggleBlockquote: () => boolean
  toggleBold: () => boolean
  toggleCode: () => boolean
  toggleCodeBlock: () => boolean
  toggleItalic: () => boolean
  toggleStrike: () => boolean
  undo: () => boolean
  uploadingImages: () => Promise<void>
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
