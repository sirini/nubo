import { toast } from "vue-sonner"
import {
  ADMIN_GROUP_CONFIG,
  type AdminDashboard,
  type AdminGroupConfig,
  type AdminGroupListResult,
  type AdminLatestComment,
  type AdminLatestPost,
  type AdminMenu,
  type AdminReportItem,
} from "~/types/admin"
import { SEARCH, type Search } from "~/types/board"

export const useAdminStore = defineStore("admin", () => {
  const {
    loadGeneralStatistic,
    loadGeneralItem,
    loadGeneralUploadUsage,
    loadReportList,
    loadCommentList,
    loadPostList,
    loadGroupList,
    loadGroupInfo,
  } = useAdmin()
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
  const latestReports = ref<AdminReportItem[]>([])
  const latestComments = ref<AdminLatestComment[]>([])
  const latestPosts = ref<AdminLatestPost[]>([])
  const groups = ref<AdminGroupConfig[]>([])
  const groupInfo = ref<AdminGroupListResult>({ config: ADMIN_GROUP_CONFIG, boards: [] })

  // 관리화면에서 메뉴 열기
  const openMenu = (newMenu: AdminMenu) => {
    menu.value = newMenu
  }

  // 대시보드에 필요한 데이터들 모두 내려받기
  const loadInitDashboard = async (daysForStat: number, limitForItem: number) => {
    const results = await Promise.allSettled([
      loadGeneralStatistic(daysForStat),
      loadGeneralItem(limitForItem),
      loadGeneralUploadUsage("./upload"),
    ])
    const [stat, item, usage] = results

    if (stat.status === "fulfilled" && stat.value.success) {
      dashboard.value.statistic = stat.value.result
    }
    if (item.status === "fulfilled" && item.value.success) {
      dashboard.value.item = item.value.result
    }
    if (usage.status === "fulfilled" && usage.value.success) {
      uploadUsage.value = usage.value.result
    }
  }

  // 최근 신고글 가져오기
  const loadInitReportList = async (limit: number) => {
    try {
      const response = await loadReportList({
        page: 1,
        limit,
        option: SEARCH.REPORT.REQUEST as Search,
        keyword: "",
        isSolved: false,
      })
      if (!response.success || !response.result) {
        toast(`최근 신고 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      latestReports.value = response.result
    } catch (e) {
      toast(`최근 신고 목록을 가져오지 못했습니다: ${e}`)
    }
  }

  // 최근 댓글 목록 가져오기
  const loadInitCommentList = async (limit: number) => {
    try {
      const response = await loadCommentList({
        page: 1,
        limit,
        option: SEARCH.CONTENT as Search,
        keyword: "",
      })
      if (!response.success || !response.result) {
        toast(`최근 댓글 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      latestComments.value = response.result
    } catch (e) {
      toast(`최근 댓글 목록을 가져오지 못했습니다: ${e}`)
    }
  }

  // 최근 게시글 목록 가져오기
  const loadInitPostList = async (limit: number) => {
    try {
      const response = await loadPostList({
        page: 1,
        limit,
        option: SEARCH.TITLE as Search,
        keyword: "",
      })
      if (!response.success || !response.result) {
        toast(`최근 게시글 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      latestPosts.value = response.result
    } catch (e) {
      toast(`최근 게시글 목록을 가져오지 못했습니다: ${e}`)
    }
  }

  // 그룹 목록 가져오기
  const loadInitGroupList = async () => {
    try {
      const response = await loadGroupList()
      if (!response.success) {
        toast(`게시판 그룹 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      groups.value = response.result
    } catch (e) {
      toast(`게시판 그룹 목록을 가져오지 못했습니다: ${e}`)
    }
  }

  // (선택된) 그룹 설정 및 소속 게시판들 가져오기
  const loadSelectedGroupInfo = async (id: string) => {
    try {
      const response = await loadGroupInfo(id)
      if (!response.success) {
        toast(`게시판 그룹 설정 및 소속 게시판들을 가져오지 못했습니다: ${response.error}`)
        return
      }
      groupInfo.value = response.result
    } catch (e) {
      toast(`게시판 그룹 설정 및 소속 게시판들을 가져오지 못했습니다: ${e}`)
    }
  }

  return {
    skin,
    menu,
    dashboard,
    uploadUsage,
    latestReports,
    latestComments,
    latestPosts,
    groups,
    groupInfo,

    openMenu,
    loadInitDashboard,
    loadInitReportList,
    loadInitCommentList,
    loadInitPostList,
    loadInitGroupList,
    loadSelectedGroupInfo,
  }
})
