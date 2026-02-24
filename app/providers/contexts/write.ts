import type { Pair } from "~/types/common"
import type { EditorTagItem } from "~/types/editor"

// [게시판 글쓰기] 화면에서 필요한 변수 & 함수들 정의
export interface NuboWriteContext {
  tag: WritableComputedRef<string>
  tags: ComputedRef<string[]>
  tagSuggestions: ComputedRef<EditorTagItem[]>
  attaches: ComputedRef<File[]>
  isLoggedIn: ComputedRef<boolean>
  isDragging: WritableComputedRef<boolean>
  isPopOver: ComputedRef<Record<string, boolean>>
  isAdmin: ComputedRef<boolean>
  isNotice: WritableComputedRef<boolean>
  isSecret: WritableComputedRef<boolean>
  categoryUid: WritableComputedRef<number>
  categories: ComputedRef<Pair[]>
  title: WritableComputedRef<string>
  titleSuggestions: WritableComputedRef<string[]>
  isSearchingTitles: ComputedRef<boolean>
  isWriting: WritableComputedRef<boolean>
  isConfirmDialog: ComputedRef<boolean>
  writeNewPost: () => Promise<void>
  dropAttaches: (event: DragEvent) => void
  changeFileList: (event: Event) => void
  getPreviewThumbnail: (filename: string) => string
  getUploadedThumbnail: (fileUid: number) => string
  openPopOver: (name: string) => void
  closePopOver: (name: string) => void
  selectSuggestedTag: (tag: string) => void
  addTag: () => void
  removeTag: (index: number) => void
  changeSelectedImages: (event: MouseEvent) => void
  selectSuggestedTitle: (title: string) => void
  removeFromList: (index: number) => void
  modifyExistPost: () => Promise<void>
  removeAttachedFile: () => Promise<void>
}

export const nuboWriteKey: InjectionKey<NuboWriteContext> = Symbol("nuboWriteContext")

// [게시판 글쓰기] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboWriteContext = () => {
  const context = inject(nuboWriteKey)
  if (!context) {
    throw new Error("useNuboWriteContext must be used within a proper provider")
  }
  return context
}
