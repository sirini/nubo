import type { AdminBoardCreateParam, AdminMenu } from "~/types/admin"
import type { NuboAdminContext } from "~/types/nubo-skin-keys"

export const useAdminProvider = (): NuboAdminContext => {
  const admin = useAdminStore()
  const auth = useAuthStore()
  const adminViews: Record<AdminMenu, any> = {
    Dashboard: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/Dashboard.vue`)),
    Board: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/Board.vue`)),
    User: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/User.vue`)),
    Report: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/Report.vue`)),
    Skin: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/Skin.vue`)),
    System: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/System.vue`)),
  }

  return {
    dashboard: computed(() => admin.dashboard),
    groupInfo: computed(() => admin.groupInfo),
    groups: computed(() => admin.groups),
    isGroupNameChangeDialog: computed(() => admin.isGroupNameChangeDialog),
    latestComments: computed(() => admin.latestComments),
    latestPosts: computed(() => admin.latestPosts),
    latestReports: computed(() => admin.latestReports),
    menu: computed(() => admin.menu),
    panel: computed(() => adminViews[admin.menu] || adminViews.Dashboard),
    statFile: computed(() => admin.dashboard.statistic.file),
    statImage: computed(() => admin.dashboard.statistic.image),
    statPost: computed(() => admin.dashboard.statistic.post),
    statReply: computed(() => admin.dashboard.statistic.reply),
    statUploadUsage: computed(() => admin.uploadUsage),
    statUser: computed(() => admin.dashboard.statistic.member),
    statVisit: computed(() => admin.dashboard.statistic.visit),
    user: computed(() => auth.user),
    changeGroupId: (newGroupId: string): Promise<boolean> => admin.changeGroupId(newGroupId),
    closeChangeGroupIdDialog: () => admin.closeChangeGroupIdDialog(),
    loadInitCommentList: (limit: number) => admin.loadInitCommentList(limit),
    loadInitDashboard: (daysForStat: number, limitForItem: number) =>
      admin.loadInitDashboard(daysForStat, limitForItem),
    loadInitGroupList: () => admin.loadInitGroupList(),
    loadInitPostList: (limit: number) => admin.loadInitPostList(limit),
    loadInitReportList: (limit: number) => admin.loadInitReportList(limit),
    loadSelectedGroupInfo: (id: string) => admin.loadSelectedGroupInfo(id),
    openChangeGroupIdDialog: (groupUid: number) => admin.openChangeGroupIdDialog(groupUid),
    openMenu: (newMenu: AdminMenu) => admin.openMenu(newMenu),
    createBoard: (param: AdminBoardCreateParam) => admin.createBoard(param),
  }
}
