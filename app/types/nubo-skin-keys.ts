import type { InjectionKey } from "vue"
import type { BoardViewResult, BoardWriterLatestComment, BoardWriterLatestPost } from "./board"
import type { ChatHistory } from "./chat"
import type { CommentResult } from "./comment"
import type { HomePostItem, HomeSidebarGroupResult } from "./home"
import type { EditProfileParam, UserInfoResult, UserMyResult } from "./user"

// [게시판 글보기] 화면에서 필요한 변수 & 함수들 정의
export interface NuboViewContext {
  view: ComputedRef<BoardViewResult>
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

// [게시판 글보기] 화면에 쓰이는 인젝션 키 정의
export const nuboViewKey: InjectionKey<NuboViewContext> = Symbol("nuboViewContext")

// [게시판 글보기] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboViewContext() {
  const context = inject(nuboViewKey)
  if (!context) {
    throw new Error("useNuboViewContext must be used within a proper provider")
  }
  return context
}

// [홈] 화면에서 필요한 변수 & 함수들 정의
export interface NuboHomeContext {
  pending: ComputedRef<boolean>
  posts: ComputedRef<HomePostItem[]>
  loadMorePosts: () => Promise<void>
}

// [홈] 화면에 쓰이는 인젝션 키 정의
export const nuboHomeKey: InjectionKey<NuboHomeContext> = Symbol("nuboHomeContext")

// [홈] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboHomeContext() {
  const context = inject(nuboHomeKey)
  if (!context) {
    throw new Error("useNuboHomeContext must be used within a proper provider")
  }
  return context
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

// [레이아웃] 화면에 쓰이는 인젝션 키 정의
export const nuboLayoutKey: InjectionKey<NuboLayoutContext> = Symbol("nuboLayoutContext")

// [레이아웃] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboLayoutContext() {
  const context = inject(nuboLayoutKey)
  if (!context) {
    throw new Error("useNuboLayoutContext must be used within a proper provider")
  }
  return context
}

// [로그인] 화면에서 필요한 변수 & 함수들 정의
export interface NuboLoginContext {
  oauthGoogleUrl: string
  oauthNaverUrl: string
  oauthKakaoUrl: string
  login: (e?: Event | undefined) => Promise<void | undefined>
}

// [로그인] 화면에 쓰이는 인젝션 키 정의
export const nuboLoginKey: InjectionKey<NuboLoginContext> = Symbol("nuboLoginContext")

// [로그인] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboLoginContext() {
  const context = inject(nuboLoginKey)
  if (!context) {
    throw new Error("useNuboLoginContext must be used within a proper provider")
  }
  return context
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

// [프로필] 화면에 쓰이는 인젝션 키 정의
export const nuboProfileKey: InjectionKey<NuboProfileContext> = Symbol("nuboProfileContext")

// [프로필] 화면에 필요한 변수 & 함수들 가져오기
export function useNuboProfileContext() {
  const context = inject(nuboProfileKey)
  if (!context) {
    throw new Error("useNuboProfileContext must be used within a proper provider")
  }
  return context
}
