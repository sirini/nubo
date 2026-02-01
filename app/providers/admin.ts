import type { AdminMenu } from "~/types/admin"
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
    user: computed(() => auth.user),
    panel: computed(() => adminViews[admin.menu] || adminViews.Dashboard),
    menu: computed(() => admin.menu),
    dashboard: computed(() => admin.dashboard),
    statUser: computed(() => admin.dashboard.statistic.member),
    statPost: computed(() => admin.dashboard.statistic.post),
    statReply: computed(() => admin.dashboard.statistic.reply),
    statVisit: computed(() => admin.dashboard.statistic.visit),
    statFile: computed(() => admin.dashboard.statistic.file),
    statImage: computed(() => admin.dashboard.statistic.image),
    statUploadUsage: computed(() => admin.uploadUsage),
    latestReports: computed(() => admin.latestReports),
    latestComments: computed(() => admin.latestComments),
    latestPosts: computed(() => admin.latestPosts),
    openMenu: (newMenu: AdminMenu) => admin.openMenu(newMenu),
    loadInitDashboard: (daysForStat: number, limitForItem: number) =>
      admin.loadInitDashboard(daysForStat, limitForItem),
    loadInitReportList: (limit: number) => admin.loadInitReportList(limit),
    loadInitCommentList: (limit: number) => admin.loadInitCommentList(limit),
    loadInitPostList: (limit: number) => admin.loadInitPostList(limit),
  }
}
