import type { InjectionKey } from "vue"
import type {
  BoardConfig,
  BoardListResult,
  BoardViewResult,
  BoardWriterLatestComment,
  BoardWriterLatestPost,
  Search,
} from "./board"
import type { ChatHistory } from "./chat"
import type { CommentResult } from "./comment"
import type { Pair } from "./common"
import type { EditorInsertImageResult, EditorTagItem } from "./editor"
import type { HomePostItem, HomeSidebarGroupResult } from "./home"
import type { EditProfileParam, UserInfoResult, UserMyResult } from "./user"

// [게시판 글목록] 화면에서 필요한 변수 & 함수들 정의
export interface NuboListContext {
  list: ComputedRef<BoardListResult>
  config: ComputedRef<BoardConfig>
  isAdmin: ComputedRef<boolean>
  isLoggedIn: ComputedRef<boolean>
  page: ComputedRef<number>
  totalPostCount: ComputedRef<number>
  option: ComputedRef<Search>
  keyword: ComputedRef<string>
  searchPost: () => void
  setPagingUrl: (targetUrl: number) => string
}

// [게시판 글보기] 화면에서 필요한 변수 & 함수들 정의
export interface NuboViewContext {
  view: ComputedRef<BoardViewResult>
  config: ComputedRef<BoardConfig>
  comments: ComputedRef<CommentResult[]>
  isLoggedIn: ComputedRef<boolean>
  isWriter: ComputedRef<boolean>
  content: ComputedRef<string>
  commentTarget: ComputedRef<{ reply: number; remove: number; modify: number }>
  checkPermissionComment: (writerUid: number) => boolean
  likeComment: (commentUid: number, liked: boolean) => Promise<void>
  confirmRemoveComment: (commentUid: number) => void
  removeComment: () => Promise<void>
  setModifyComment: (commentUid: number, content: string) => void
  setReplyComment: (commentUid: number, content: string) => void
  writeNewComment: () => Promise<void>
  writeReplyComment: () => Promise<void>
  modifyExistComment: () => Promise<void>
  downloadFile: (fileUid: number) => Promise<void>
  likePost: (isLiked: boolean) => Promise<void>
}

// [게시판 글쓰기] 화면에서 필요한 변수 & 함수들 정의
export interface NuboWriteContext {
  tag: ComputedRef<string>
  tags: ComputedRef<string[]>
  tagSuggestions: ComputedRef<EditorTagItem[]>
  attaches: ComputedRef<File[]>
  isDragging: ComputedRef<boolean>
  isPopOver: ComputedRef<Record<string, boolean>>
  isAdmin: ComputedRef<boolean>
  isNotice: ComputedRef<boolean>
  isSecret: ComputedRef<boolean>
  categoryUid: ComputedRef<number>
  categories: ComputedRef<Pair[]>
  title: ComputedRef<string>
  titleSuggestions: ComputedRef<string[]>
  isSearchingTitles: ComputedRef<boolean>
  isWriting: ComputedRef<boolean>
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

// [에디터] 에 필요한 변수 & 함수들 정의
export interface NuboEditorContext {
  config: ComputedRef<BoardConfig>
  content: ComputedRef<string>
  isAddLinkDialog: ComputedRef<boolean>
  isImageUploadDialog: ComputedRef<boolean>
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

// [프로필] 화면에서 필요한 변수 & 함수들 정의
export interface NuboProfileContext {
  isLoggedIn: ComputedRef<boolean>
  userLatestPosts: ComputedRef<BoardWriterLatestPost[]>
  userLatestComments: ComputedRef<BoardWriterLatestComment[]>
  profileUser: ComputedRef<UserInfoResult>
  isMe: ComputedRef<boolean>
  myPoint: ComputedRef<number>
  isOpenReportForm: ComputedRef<boolean>
  isLoading: ComputedRef<boolean>
  chatHistories: ComputedRef<ChatHistory[]>
  chatMyUid: ComputedRef<number>
  chatMessage: ComputedRef<string>
  editProfile: ComputedRef<EditProfileParam>
  reportReasons: ComputedRef<{ label: string; description: string }[]>
  isReportedUser: ComputedRef<boolean>
  reportReason: ComputedRef<string>
  reportDescription: ComputedRef<string>
  isCheckedBlackList: ComputedRef<boolean>
  sendChatMessage: () => Promise<void>
  changeProfileImage: (event: Event) => void
  updateMyProfile: () => Promise<void>
  openReportForm: (userUid: number) => void
  reportBadUser: () => Promise<void>
  closeReportForm: () => void
}

// [홈] 화면에서 필요한 변수 & 함수들 정의
export interface NuboHomeContext {
  pending: ComputedRef<boolean>
  posts: ComputedRef<HomePostItem[]>
  loadMorePosts: () => Promise<void>
}

// [레이아웃] 화면에서 필요한 변수 & 함수들 정의
export interface NuboLayoutContext {
  isLoggedIn: ComputedRef<boolean>
  user: ComputedRef<UserMyResult>
  menus: ComputedRef<HomeSidebarGroupResult[]>
  searchOptions: ComputedRef<{ label: string; value: number }[]>
  searchOption: ComputedRef<number>
  searchKeyword: ComputedRef<string>
  search: (event: Event) => void
  moveTop: () => void
}

// [로그인] 화면에서 필요한 변수 & 함수들 정의
export interface NuboLoginContext {
  oauthGoogleUrl: string
  oauthNaverUrl: string
  oauthKakaoUrl: string
  login: (e?: Event | undefined) => Promise<void | undefined>
}

export const nuboListKey: InjectionKey<NuboListContext> = Symbol("nuboListContext")
export const nuboViewKey: InjectionKey<NuboViewContext> = Symbol("nuboViewContext")
export const nuboWriteKey: InjectionKey<NuboWriteContext> = Symbol("nuboWriteContext")
export const nuboEditorKey: InjectionKey<NuboEditorContext> = Symbol("nuboEditorContext")
export const nuboHomeKey: InjectionKey<NuboHomeContext> = Symbol("nuboHomeContext")
export const nuboLayoutKey: InjectionKey<NuboLayoutContext> = Symbol("nuboLayoutContext")
export const nuboLoginKey: InjectionKey<NuboLoginContext> = Symbol("nuboLoginContext")
export const nuboProfileKey: InjectionKey<NuboProfileContext> = Symbol("nuboProfileContext")

// [게시판 글목록] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboListContext() {
  const context = inject(nuboListKey)
  if (!context) {
    throw new Error("useNuboListContext must be used within a proper provider")
  }
  return context
}

// [게시판 글보기] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboViewContext() {
  const context = inject(nuboViewKey)
  if (!context) {
    throw new Error("useNuboViewContext must be used within a proper provider")
  }
  return context
}

// [게시판 글쓰기] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboWriteContext() {
  const context = inject(nuboWriteKey)
  if (!context) {
    throw new Error("useNuboWriteContext must be used within a proper provider")
  }
  return context
}

// [에디터] 에 필요한 변수 & 함수들 가져오기
export function useNuboEditorContext() {
  const context = inject(nuboEditorKey)
  if (!context) {
    throw new Error("useNuboEditorContext must be used within a proper provider")
  }
  return context
}

// [홈] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboHomeContext() {
  const context = inject(nuboHomeKey)
  if (!context) {
    throw new Error("useNuboHomeContext must be used within a proper provider")
  }
  return context
}

// [레이아웃] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboLayoutContext() {
  const context = inject(nuboLayoutKey)
  if (!context) {
    throw new Error("useNuboLayoutContext must be used within a proper provider")
  }
  return context
}

// [로그인] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboLoginContext() {
  const context = inject(nuboLoginKey)
  if (!context) {
    throw new Error("useNuboLoginContext must be used within a proper provider")
  }
  return context
}

// [프로필] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboProfileContext() {
  const context = inject(nuboProfileKey)
  if (!context) {
    throw new Error("useNuboProfileContext must be used within a proper provider")
  }
  return context
}
