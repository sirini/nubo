import type {
  AdminBoardCreateParam,
  AdminBoardModifyParam,
  AdminBoardResult,
  AdminDashboard,
  AdminDashboardStatistic,
  AdminGroupConfig,
  AdminGroupListResult,
  AdminLatestComment,
  AdminLatestPost,
  AdminMenu,
  AdminReportItem,
} from "~/types/admin"
import type { Pair } from "~/types/common"
import type { UserMyResult } from "~/types/user"

// [관리자] 화면에서 필요한 변수 & 함수들 정의
export interface NuboAdminContext {
  dashboard: ComputedRef<AdminDashboard>
  groupInfo: ComputedRef<AdminGroupListResult>
  groups: ComputedRef<AdminGroupConfig[]>
  isBoardRemoveConfirmDialog: ComputedRef<boolean>
  isGroupNameChangeDialog: ComputedRef<boolean>
  latestComments: ComputedRef<AdminLatestComment[]>
  latestPosts: ComputedRef<AdminLatestPost[]>
  latestReports: ComputedRef<AdminReportItem[]>
  menu: ComputedRef<AdminMenu>
  panel: ComputedRef<any>
  statFile: ComputedRef<AdminDashboardStatistic>
  statImage: ComputedRef<AdminDashboardStatistic>
  statPost: ComputedRef<AdminDashboardStatistic>
  statReply: ComputedRef<AdminDashboardStatistic>
  statUploadUsage: ComputedRef<number>
  statUser: ComputedRef<AdminDashboardStatistic>
  statVisit: ComputedRef<AdminDashboardStatistic>
  targetBoard: ComputedRef<Pair>
  user: ComputedRef<UserMyResult>
  changeGroupId: (newGroupId: string) => Promise<boolean>
  closeBoardRemoveConfirmDialog: () => void
  closeChangeGroupIdDialog: () => void
  createBoard: (param: AdminBoardCreateParam) => Promise<number>
  getBoardConfig: (id: string) => Promise<AdminBoardResult>
  loadInitCommentList: (limit: number) => Promise<void>
  loadInitDashboard: (daysForStat: number, limitForItem: number) => Promise<void>
  loadInitGroupList: () => Promise<void>
  loadInitPostList: (limit: number) => Promise<void>
  loadInitReportList: (limit: number) => Promise<void>
  loadSelectedGroupInfo: (id: string) => Promise<void>
  modifyBoard: (param: AdminBoardModifyParam) => Promise<boolean>
  openBoardRemoveConfirmDialog: (boardUid: number, boardId: string) => void
  openChangeGroupIdDialog: (groupUid: number) => void
  openMenu: (menu: AdminMenu) => void
  removeBoard: () => Promise<void>
}

export const nuboAdminKey: InjectionKey<NuboAdminContext> = Symbol("nuboAdminContext")

// [관리자] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboAdminContext = () => {
  const context = inject(nuboAdminKey)
  if (!context) {
    throw new Error("useAdminContext must be used within a proper provider")
  }
  return context
}
