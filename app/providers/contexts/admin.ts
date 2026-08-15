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
  AdminUserCreateParam,
  AdminUserInfo,
  AdminUserListResult,
  AdminUserModifyParam,
} from "~/types/admin"
import type { BoardWriter, Search } from "~/types/board"
import type { Pair } from "~/types/common"
import type { UserMyResult, UserPermissionManageParam } from "~/types/user"
import type { Component } from "vue"

// [관리자] 화면에서 필요한 변수 & 함수들 정의
export interface NuboAdminContext {
  dashboard: ComputedRef<AdminDashboard>
  groupInfo: ComputedRef<AdminGroupListResult>
  groups: ComputedRef<AdminGroupConfig[]>
  isAddGroupDialog: WritableComputedRef<boolean>
  isBoardRemoveConfirmDialog: WritableComputedRef<boolean>
  isGroupNameChangeDialog: WritableComputedRef<boolean>
  isGroupRemoveConfirmDialog: WritableComputedRef<boolean>
  isUserRemoveConfirmDialog: WritableComputedRef<boolean>
  keyword: WritableComputedRef<string>
  latestComments: ComputedRef<AdminLatestComment[]>
  latestPosts: ComputedRef<AdminLatestPost[]>
  latestReports: ComputedRef<AdminReportItem[]>
  reportTotal: ComputedRef<number>
  isBlocked: WritableComputedRef<boolean>
  limit: WritableComputedRef<number>
  menu: ComputedRef<AdminMenu>
  option: WritableComputedRef<Search>
  page: WritableComputedRef<number>
  panel: ComputedRef<Component>
  statFile: ComputedRef<AdminDashboardStatistic>
  statImage: ComputedRef<AdminDashboardStatistic>
  statPost: ComputedRef<AdminDashboardStatistic>
  statReply: ComputedRef<AdminDashboardStatistic>
  statUploadUsage: ComputedRef<number>
  statUser: ComputedRef<AdminDashboardStatistic>
  statVisit: ComputedRef<AdminDashboardStatistic>
  targetBoard: ComputedRef<Pair>
  targetGroup: ComputedRef<Pair>
  targetUser: ComputedRef<Pair>
  user: ComputedRef<UserMyResult>
  userList: ComputedRef<AdminUserListResult>
  changeGroupId: (newGroupId: string) => Promise<boolean>
  changeGroupAdmin: (groupUid: number, targetUserUid: number) => Promise<boolean>
  changeUserPermission: (param: UserPermissionManageParam) => Promise<void>
  closeAddGroupDialog: () => void
  closeBoardRemoveConfirmDialog: () => void
  closeChangeGroupIdDialog: () => void
  closeGroupRemoveConfirmDialog: () => void
  closeUserRemoveConfirmDialog: () => void
  createBoard: (param: AdminBoardCreateParam) => Promise<number>
  createGroup: (newGroupId: string) => Promise<AdminGroupConfig | null>
  createUser: (param: AdminUserCreateParam) => Promise<number>
  getBoardConfig: (id: string) => Promise<AdminBoardResult>
  getUserInfo: (userUid: number) => Promise<AdminUserInfo>
  getUserPermission: (userUid: number) => Promise<UserPermissionManageParam>
  loadInitCommentList: (limit: number) => Promise<void>
  loadInitDashboard: (daysForStat: number, limitForItem: number) => Promise<void>
  loadInitGroupList: () => Promise<void>
  loadInitPostList: (limit: number) => Promise<void>
  loadInitReportList: (isSolved: boolean, limit?: number) => Promise<void>
  loadInitUserList: () => Promise<void>
  loadSelectedGroupInfo: (id: string) => Promise<void>
  modifyBoard: (param: AdminBoardModifyParam) => Promise<boolean>
  modifyUser: (param: AdminUserModifyParam) => Promise<boolean>
  openAddGroupDialog: () => void
  openBoardRemoveConfirmDialog: (boardUid: number, boardId: string) => void
  openChangeGroupIdDialog: (groupUid: number, oldName: string) => void
  openGroupRemoveConfirmDialog: (groupUid: number, groupId: string) => void
  openUserRemoveConfirmDialog: (userUid: number, name: string) => void
  openMenu: (menu: AdminMenu) => void
  removeBoard: () => Promise<void>
  removeGroup: () => Promise<void>
  removeUser: () => Promise<void>
  searchAdminCandidates: (scope: "board" | "group", name: string) => Promise<BoardWriter[]>
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
