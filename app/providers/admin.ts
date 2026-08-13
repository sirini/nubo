import type {
  AdminBoardCreateParam,
  AdminBoardModifyParam,
  AdminMenu,
  AdminUserCreateParam,
  AdminUserModifyParam,
} from "~/types/admin"
import type { UserPermissionManageParam } from "~/types/user"
import type { NuboAdminContext } from "./contexts/admin"
import type { Component } from "vue"

export const useAdminProvider = (): NuboAdminContext => {
  const admin = useAdminStore()
  const auth = useAuthStore()
  const adminViews: Record<AdminMenu, Component> = {
    Dashboard: defineAsyncComponent(() => import(`~/skins/${admin.skin}/Dashboard.vue`)),
    Board: defineAsyncComponent(() => import(`~/skins/${admin.skin}/Board.vue`)),
    User: defineAsyncComponent(() => import(`~/skins/${admin.skin}/User.vue`)),
    Report: defineAsyncComponent(() => import(`~/skins/${admin.skin}/Report.vue`)),
    Skin: defineAsyncComponent(() => import(`~/skins/${admin.skin}/Skin.vue`)),
    System: defineAsyncComponent(() => import(`~/skins/${admin.skin}/System.vue`)),
  }

  return {
    dashboard: computed(() => admin.dashboard),
    groupInfo: computed(() => admin.groupInfo),
    groups: computed(() => admin.groups),
    isAddGroupDialog: computed({
      get: () => admin.isAddGroupDialog,
      set: (val) => (admin.isAddGroupDialog = val),
    }),
    isBoardRemoveConfirmDialog: computed({
      get: () => admin.isBoardRemoveConfirmDialog,
      set: (val) => (admin.isBoardRemoveConfirmDialog = val),
    }),
    isGroupNameChangeDialog: computed({
      get: () => admin.isGroupNameChangeDialog,
      set: (val) => (admin.isGroupNameChangeDialog = val),
    }),
    isGroupRemoveConfirmDialog: computed({
      get: () => admin.isGroupRemoveConfirmDialog,
      set: (val) => (admin.isGroupRemoveConfirmDialog = val),
    }),
    isUserRemoveConfirmDialog: computed({
      get: () => admin.isUserRemoveConfirmDialog,
      set: (val) => (admin.isUserRemoveConfirmDialog = val),
    }),
    keyword: computed({ get: () => admin.keyword, set: (val) => (admin.keyword = val) }),
    latestComments: computed(() => admin.latestComments),
    latestPosts: computed(() => admin.latestPosts),
    latestReports: computed(() => admin.latestReports),
    reportTotal: computed(() => admin.reportTotal),
    isBlocked: computed({ get: () => admin.isBlocked, set: (val) => (admin.isBlocked = val) }),
    limit: computed({ get: () => admin.limit, set: (val) => (admin.limit = val) }),
    menu: computed(() => admin.menu),
    option: computed({ get: () => admin.option, set: (val) => (admin.option = val) }),
    page: computed({ get: () => admin.page, set: (val) => (admin.page = val) }),
    panel: computed(() => adminViews[admin.menu] || adminViews.Dashboard),
    statFile: computed(() => admin.dashboard.statistic.file),
    statImage: computed(() => admin.dashboard.statistic.image),
    statPost: computed(() => admin.dashboard.statistic.post),
    statReply: computed(() => admin.dashboard.statistic.reply),
    statUploadUsage: computed(() => admin.uploadUsage),
    statUser: computed(() => admin.dashboard.statistic.member),
    statVisit: computed(() => admin.dashboard.statistic.visit),
    targetBoard: computed(() => admin.targetBoard),
    targetGroup: computed(() => admin.targetGroup),
    targetUser: computed(() => admin.targetUser),
    user: computed(() => auth.user),
    userList: computed(() => admin.userList),
    changeGroupId: (newGroupId: string): Promise<boolean> => admin.changeGroupId(newGroupId),
    changeGroupAdmin: (groupUid: number, targetUserUid: number) => admin.changeGroupAdmin(groupUid, targetUserUid),
    changeUserPermission: (param: UserPermissionManageParam) => admin.changeUserPermission(param),
    closeAddGroupDialog: () => admin.closeAddGroupDialog,
    closeBoardRemoveConfirmDialog: () => admin.closeBoardRemoveConfirmDialog(),
    closeChangeGroupIdDialog: () => admin.closeChangeGroupIdDialog(),
    closeGroupRemoveConfirmDialog: () => admin.closeGroupRemoveConfirmDialog(),
    closeUserRemoveConfirmDialog: () => admin.closeUserRemoveConfirmDialog(),
    createBoard: (param: AdminBoardCreateParam) => admin.createBoard(param),
    createGroup: (newGroupId: string) => admin.createGroup(newGroupId),
    createUser: (param: AdminUserCreateParam) => admin.createUser(param),
    getBoardConfig: (id: string) => admin.getBoardConfig(id),
    getUserInfo: (userUid: number) => admin.getUserInfo(userUid),
    getUserPermission: (userUid: number) => admin.getUserPermission(userUid),
    loadInitCommentList: (limit: number) => admin.loadInitCommentList(limit),
    loadInitDashboard: (daysForStat: number, limitForItem: number) =>
      admin.loadInitDashboard(daysForStat, limitForItem),
    loadInitGroupList: () => admin.loadInitGroupList(),
    loadInitPostList: (limit: number) => admin.loadInitPostList(limit),
    loadInitReportList: (isSolved: boolean, limit?: number) => admin.loadInitReportList(isSolved, limit),
    loadInitUserList: () => admin.loadInitUserList(),
    loadSelectedGroupInfo: (id: string) => admin.loadSelectedGroupInfo(id),
    modifyBoard: (param: AdminBoardModifyParam) => admin.modifyBoard(param),
    modifyUser: (param: AdminUserModifyParam) => admin.modifyUser(param),
    openAddGroupDialog: () => admin.openAddGroupDialog(),
    openBoardRemoveConfirmDialog: (boardUid: number, boardId: string) =>
      admin.openBoardRemoveConfirmDialog(boardUid, boardId),
    openChangeGroupIdDialog: (groupUid: number, oldName: string) =>
      admin.openChangeGroupIdDialog(groupUid, oldName),
    openGroupRemoveConfirmDialog: (groupUid: number, groupId: string) =>
      admin.openGroupRemoveConfirmDialog(groupUid, groupId),
    openUserRemoveConfirmDialog: (userUid: number, name: string) =>
      admin.openUserRemoveConfirmDialog(userUid, name),
    openMenu: (newMenu: AdminMenu) => admin.openMenu(newMenu),
    removeBoard: () => admin.removeBoard(),
    removeGroup: () => admin.removeGroup(),
    removeUser: () => admin.removeUser(),
    searchAdminCandidates: (scope: "board" | "group", name: string) => admin.searchAdminCandidates(scope, name),
  }
}
