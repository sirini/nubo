import type { BoardWriterLatestComment, BoardWriterLatestPost } from "~/types/board"
import type { ChatHistory } from "~/types/chat"
import type { EditProfileParam, UserInfoResult } from "~/types/user"

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

export const nuboProfileKey: InjectionKey<NuboProfileContext> = Symbol("nuboProfileContext")

// [프로필] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboProfileContext = () => {
  const context = inject(nuboProfileKey)
  if (!context) {
    throw new Error("useNuboProfileContext must be used within a proper provider")
  }
  return context
}
