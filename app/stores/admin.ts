import type { AdminDashboard, AdminMenu } from "~/types/admin"

export const useAdminStore = defineStore("admin", () => {
  const { loadGeneralStatistic, loadGeneralLatest, loadGeneralItem, loadGeneralUploadUsage } =
    useAdmin()
  const skin = ref<string>("nubo-basic-admin")
  const menu = ref<AdminMenu>("Dashboard")
  const dashboard = ref<AdminDashboard>({
    statistic: {
      visit: { history: [], total: 0 },
      member: { history: [], total: 0 },
      post: { history: [], total: 0 },
      reply: { history: [], total: 0 },
      file: { history: [], total: 0 },
      image: { history: [], total: 0 },
    },
    latest: { posts: [], comments: [], reports: [] },
    item: { groups: [], boards: [], members: [] },
  })
  const uploadUsage = ref<number>(0)

  // 관리화면에서 메뉴 열기
  const openMenu = (newMenu: AdminMenu) => {
    menu.value = newMenu
  }

  // 대시보드에 필요한 데이터들 모두 내려받기
  const loadInitDashboard = async (
    daysForStat: number,
    limitForLatest: number,
    limitForItem: number,
  ) => {
    const results = await Promise.allSettled([
      loadGeneralStatistic(daysForStat),
      loadGeneralLatest(limitForLatest),
      loadGeneralItem(limitForItem),
      loadGeneralUploadUsage("./upload"),
    ])
    const [stat, latest, item, usage] = results

    if (stat.status === "fulfilled" && stat.value.success) {
      dashboard.value.statistic = stat.value.result
    }
    if (latest.status === "fulfilled" && latest.value.success) {
      dashboard.value.latest = latest.value.result
    }
    if (item.status === "fulfilled" && item.value.success) {
      dashboard.value.item = item.value.result
    }
    if (usage.status === "fulfilled" && usage.value.success) {
      uploadUsage.value = usage.value.result
    }
  }

  return {
    skin,
    menu,
    dashboard,
    uploadUsage,

    openMenu,
    loadInitDashboard,
  }
})
