import { toast } from "vue-sonner"
import type { AdminDashboard, AdminMenu } from "~/types/admin"

export const useAdminStore = defineStore("admin", () => {
  const { loadGeneralStatistic, loadGeneralLatest, loadGeneralItem } = useAdmin()
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
    const respStat = await loadGeneralStatistic(daysForStat)
    if (!respStat.success) {
      toast(`❌ 대시보드용 기본적인 통계 데이터를 가져오지 못했습니다: ${respStat.error}`)
      return
    }
    dashboard.value.statistic = respStat.result

    const respLatest = await loadGeneralLatest(limitForLatest)
    if (!respLatest.success) {
      toast(`❌ 대시보드용 최근 게시글/댓글/신고글을 가져오지 못했습니다: ${respLatest.error}`)
      return
    }
    dashboard.value.latest = respLatest.result

    const respItem = await loadGeneralItem(limitForItem)
    if (!respItem.success) {
      toast(`❌ 대시보드용 그룹/게시판/회원 최근 목록들을 가져오지 못했습니다: ${respItem.error}`)
      return
    }
    dashboard.value.item = respItem.result
  }

  return {
    skin,
    menu,
    dashboard,

    openMenu,
    loadInitDashboard,
  }
})
