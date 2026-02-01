import type { InjectionKey } from "vue"
import type {
  AdminDashboard,
  AdminDashboardStatistic,
  AdminGroupConfig,
  AdminGroupListResult,
  AdminLatestComment,
  AdminLatestPost,
  AdminMenu,
  AdminReportItem,
} from "./admin"
import type {
  BoardConfig,
  BoardListItem,
  BoardViewResult,
  BoardWriterLatestComment,
  BoardWriterLatestPost,
  Search,
  TableOfContent,
} from "./board"
import type { ChatHistory } from "./chat"
import type { CommentResult } from "./comment"
import type { Pair } from "./common"
import type { EditorInsertImageResult, EditorTagItem } from "./editor"
import type { HomePostItem, HomeSidebarGroupResult } from "./home"
import type { EditProfileParam, UserInfoResult, UserMyResult } from "./user"

// [관리자] 화면에서 필요한 변수 & 함수들 정의
export interface NuboAdminContext {
  user: ComputedRef<UserMyResult>
  panel: ComputedRef<any>
  menu: ComputedRef<AdminMenu>
  dashboard: ComputedRef<AdminDashboard>
  statUser: ComputedRef<AdminDashboardStatistic>
  statPost: ComputedRef<AdminDashboardStatistic>
  statReply: ComputedRef<AdminDashboardStatistic>
  statVisit: ComputedRef<AdminDashboardStatistic>
  statFile: ComputedRef<AdminDashboardStatistic>
  statImage: ComputedRef<AdminDashboardStatistic>
  statUploadUsage: ComputedRef<number>
  latestReports: ComputedRef<AdminReportItem[]>
  latestComments: ComputedRef<AdminLatestComment[]>
  latestPosts: ComputedRef<AdminLatestPost[]>
  groups: ComputedRef<AdminGroupConfig[]>
  groupInfo: ComputedRef<AdminGroupListResult>
  openMenu: (menu: AdminMenu) => void
  loadInitDashboard: (daysForStat: number, limitForItem: number) => Promise<void>
  loadInitReportList: (limit: number) => Promise<void>
  loadInitCommentList: (limit: number) => Promise<void>
  loadInitPostList: (limit: number) => Promise<void>
  loadInitGroupList: () => Promise<void>
  loadSelectedGroupInfo: (id: string) => Promise<void>
}

// [게시판 글목록] 화면에서 필요한 변수 & 함수들 정의
export interface NuboListContext {
  notices: ComputedRef<BoardListItem[]>
  posts: ComputedRef<BoardListItem[]>
  userBlackList: ComputedRef<number[]>
  config: ComputedRef<BoardConfig>
  isAdmin: ComputedRef<boolean>
  isLoggedIn: ComputedRef<boolean>
  page: ComputedRef<number>
  totalPostCount: ComputedRef<number>
  option: WritableComputedRef<Search>
  keyword: WritableComputedRef<string>
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
  imgIdx: WritableComputedRef<number>
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
  makeTableOfContents: () => TableOfContent[]
  updateReadingProgress: (element: string) => void
}

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
  chatMessage: WritableComputedRef<string>
  editProfile: ComputedRef<EditProfileParam>
  reportReasons: ComputedRef<{ label: string; description: string }[]>
  isReportedUser: ComputedRef<boolean>
  reportReason: WritableComputedRef<string>
  reportDescription: WritableComputedRef<string>
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
  isLoading: ComputedRef<boolean>
  isLastPost: ComputedRef<boolean>
  posts: ComputedRef<HomePostItem[]>
  loadMorePosts: () => Promise<void>
}

// [레이아웃] 화면에서 필요한 변수 & 함수들 정의
export interface NuboLayoutContext {
  isAdmin: ComputedRef<boolean>
  isLoggedIn: ComputedRef<boolean>
  user: ComputedRef<UserMyResult>
  menus: ComputedRef<HomeSidebarGroupResult[]>
  searchOptions: ComputedRef<{ label: string; value: number }[]>
  searchOption: WritableComputedRef<number>
  searchKeyword: WritableComputedRef<string>
  search: (event: Event) => void
  moveTop: () => void
}

// [로그인] 화면에서 필요한 변수 & 함수들 정의
export interface NuboLoginContext {
  joinEmail: ComputedRef<string>
  joinName: ComputedRef<string>
  joinPassword: WritableComputedRef<string>
  joinPassword2: WritableComputedRef<string>
  verifyCode: WritableComputedRef<string>
  verifyTarget: WritableComputedRef<number>
  isLoading: WritableComputedRef<boolean>
  isValidEmail: ComputedRef<boolean>
  isValidName: ComputedRef<boolean>
  isValidPassword: ComputedRef<boolean>
  isValidCode: ComputedRef<boolean>
  isRequestedReset: ComputedRef<boolean>
  oauthGoogleUrl: string
  oauthNaverUrl: string
  oauthKakaoUrl: string
  resetCode: WritableComputedRef<string>
  resetTarget: WritableComputedRef<number>
  resetPassword: WritableComputedRef<string>
  resetPassword2: WritableComputedRef<string>
  login: (e?: Event | undefined) => Promise<void | undefined>
  isUsedEmail: () => Promise<void>
  isUsedName: () => Promise<void>
  submit: () => Promise<void>
  clearJoinForm: () => void
  verify: () => Promise<void>
  requestResetPassword: () => Promise<void>
  updateUserPassword: () => Promise<void>
}

export const nuboAdminKey: InjectionKey<NuboAdminContext> = Symbol("nuboAdminContext")
export const nuboListKey: InjectionKey<NuboListContext> = Symbol("nuboListContext")
export const nuboViewKey: InjectionKey<NuboViewContext> = Symbol("nuboViewContext")
export const nuboWriteKey: InjectionKey<NuboWriteContext> = Symbol("nuboWriteContext")
export const nuboEditorKey: InjectionKey<NuboEditorContext> = Symbol("nuboEditorContext")
export const nuboHomeKey: InjectionKey<NuboHomeContext> = Symbol("nuboHomeContext")
export const nuboLayoutKey: InjectionKey<NuboLayoutContext> = Symbol("nuboLayoutContext")
export const nuboLoginKey: InjectionKey<NuboLoginContext> = Symbol("nuboLoginContext")
export const nuboProfileKey: InjectionKey<NuboProfileContext> = Symbol("nuboProfileContext")

// [관리자] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboAdminContext = () => {
  const context = inject(nuboAdminKey)
  if (!context) {
    throw new Error("useAdminContext must be used within a proper provider")
  }
  return context
}

// [게시판 글목록] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboListContext = () => {
  const context = inject(nuboListKey)
  if (!context) {
    throw new Error("useNuboListContext must be used within a proper provider")
  }
  return context
}

// [게시판 글보기] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboViewContext = () => {
  const context = inject(nuboViewKey)
  if (!context) {
    throw new Error("useNuboViewContext must be used within a proper provider")
  }
  return context
}

// [게시판 글쓰기] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboWriteContext = () => {
  const context = inject(nuboWriteKey)
  if (!context) {
    throw new Error("useNuboWriteContext must be used within a proper provider")
  }
  return context
}

// [에디터] 에 필요한 변수 & 함수들 가져오기
export const useNuboEditorContext = () => {
  const context = inject(nuboEditorKey)
  if (!context) {
    throw new Error("useNuboEditorContext must be used within a proper provider")
  }
  return context
}

// [홈] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboHomeContext = () => {
  const context = inject(nuboHomeKey)
  if (!context) {
    throw new Error("useNuboHomeContext must be used within a proper provider")
  }
  return context
}

// [레이아웃] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboLayoutContext = () => {
  const context = inject(nuboLayoutKey)
  if (!context) {
    throw new Error("useNuboLayoutContext must be used within a proper provider")
  }
  return context
}

// [로그인] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboLoginContext = () => {
  const context = inject(nuboLoginKey)
  if (!context) {
    throw new Error("useNuboLoginContext must be used within a proper provider")
  }
  return context
}

// [프로필] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboProfileContext = () => {
  const context = inject(nuboProfileKey)
  if (!context) {
    throw new Error("useNuboProfileContext must be used within a proper provider")
  }
  return context
}
