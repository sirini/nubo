import type { BoardConfig, BoardViewResult, TableOfContent } from "~/types/board"
import type { CommentResult } from "~/types/comment"

// [게시판 글보기] 화면에서 필요한 변수 & 함수들 정의
export interface NuboViewContext {
  view: ComputedRef<BoardViewResult>
  config: ComputedRef<BoardConfig>
  comments: ComputedRef<CommentResult[]>
  isAdmin: ComputedRef<boolean>
  isConfirmRemoveCommentDialog: WritableComputedRef<boolean>
  isConfirmRemovePostDialog: WritableComputedRef<boolean>
  isLoggedIn: ComputedRef<boolean>
  isWriter: ComputedRef<boolean>
  imgIdx: WritableComputedRef<number>
  content: ComputedRef<string>
  commentTarget: ComputedRef<{ reply: number; remove: number; modify: number }>
  checkPermissionComment: (writerUid: number) => boolean
  likeComment: (commentUid: number, liked: boolean) => Promise<void>
  confirmRemoveComment: (commentUid: number) => void
  confirmRemovePost: (postUid: number) => void
  removeComment: () => Promise<void>
  setModifyComment: (commentUid: number, content: string) => void
  setReplyComment: (commentUid: number, content: string) => void
  writeNewComment: () => Promise<void>
  writeReplyComment: () => Promise<void>
  modifyExistComment: () => Promise<void>
  downloadFile: (fileUid: number) => Promise<void>
  likePost: (isLiked: boolean) => Promise<void>
  makeTableOfContents: () => TableOfContent[]
  updateReadingProgress: (element: string) => void
  clearReadingProgress: () => void
  remove: (boardUid: number, postUid: number) => void
}

export const nuboViewKey: InjectionKey<NuboViewContext> = Symbol("nuboViewContext")

// [게시판 글보기] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboViewContext = () => {
  const context = inject(nuboViewKey)
  if (!context) {
    throw new Error("useNuboViewContext must be used within a proper provider")
  }
  return context
}
