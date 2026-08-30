import type {
  BoardStudioParam,
  BoardStudioResult,
  BoardWriterLatestComment,
  BoardWriterLatestPost,
} from "~/types/board"
import type { ChatHistory } from "~/types/chat"
import type { Resp } from "~/types/common"
import type { HomeSidebarBoardResult } from "~/types/home"
import type { EditProfileParam, UserInfoResult } from "~/types/user"

// [프로필] 화면에서 필요한 변수 & 함수들 정의
export interface NuboProfileContext {
  chatHistories: ComputedRef<ChatHistory[]>
  chatMessage: WritableComputedRef<string>
  chatMyUid: ComputedRef<number>
  editProfile: ComputedRef<EditProfileParam>
  isBlockedByMe: ComputedRef<boolean>
  isLoading: ComputedRef<boolean>
  isLoggedIn: ComputedRef<boolean>
  isMe: ComputedRef<boolean>
  isOpenReportForm: WritableComputedRef<boolean>
  isReportedUser: ComputedRef<boolean>
  myPoint: ComputedRef<number>
  profileUser: ComputedRef<UserInfoResult>
  profileBoards: ComputedRef<HomeSidebarBoardResult[]>
  reportDescription: WritableComputedRef<string>
  reportReason: WritableComputedRef<string>
  reportReasons: ComputedRef<{ label: string; description: string }[]>
  userLatestComments: ComputedRef<BoardWriterLatestComment[]>
  userLatestPosts: ComputedRef<BoardWriterLatestPost[]>
  changeProfileImage: (event: Event) => void
  changeUserBlock: () => Promise<void>
  closeReportForm: () => void
  openReportForm: (userUid: number) => void
  reportBadUser: () => Promise<void>
  sendChatMessage: () => Promise<void>
  loadMyStudio: (param: BoardStudioParam) => Promise<Resp<BoardStudioResult>>
  updateMyProfile: () => Promise<void>
}

export const nuboProfileKey: InjectionKey<NuboProfileContext> = Symbol("nuboProfileContext")

// [프로필] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboProfileContext = () => {
  const context = inject(nuboProfileKey)
  if (!context) {
    throw new Error("useNuboProfileContext must be used within a proper provider")
  }
  return context
}
