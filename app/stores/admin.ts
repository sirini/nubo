import { toast } from "vue-sonner"
import {
  ADMIN_GROUP_CONFIG,
  type AdminBoardCreateParam,
  type AdminBoardModifyParam,
  type AdminBoardResult,
  type AdminDashboard,
  type AdminGroupConfig,
  type AdminGroupListResult,
  type AdminLatestComment,
  type AdminLatestPost,
  type AdminMenu,
  type AdminReportItem,
} from "~/types/admin"
import { BOARD_CONFIG, SEARCH, type Search } from "~/types/board"
import type { Pair } from "~/types/common"

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
    loadBoardConfig,
    updateGroupId,
    createNewBoard,
    modifyExistBoard,
    removeExistBoard,
  } = useAdmin()
  const isGroupNameChangeDialog = ref<boolean>(false)
  const isBoardRemoveConfirmDialog = ref<boolean>(false)
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
  const targetGroupUid = ref<number>(0)
  const targetBoard = ref<Pair>({ uid: 0, name: "" })

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
        toast(`❌ 최근 신고 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      latestReports.value = response.result
    } catch (e) {
      toast(`❌ 최근 신고 목록을 가져오지 못했습니다: ${e}`)
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
        toast(`❌ 최근 댓글 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      latestComments.value = response.result
    } catch (e) {
      toast(`❌ 최근 댓글 목록을 가져오지 못했습니다: ${e}`)
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
        toast(`❌ 최근 게시글 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      latestPosts.value = response.result
    } catch (e) {
      toast(`❌ 최근 게시글 목록을 가져오지 못했습니다: ${e}`)
    }
  }

  // 그룹 목록 가져오기
  const loadInitGroupList = async () => {
    try {
      const response = await loadGroupList()
      if (!response.success) {
        toast(`❌ 게시판 그룹 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      groups.value = response.result
    } catch (e) {
      toast(`❌ 게시판 그룹 목록을 가져오지 못했습니다: ${e}`)
    }
  }

  // (선택된) 그룹 설정 및 소속 게시판들 가져오기
  const loadSelectedGroupInfo = async (id: string) => {
    try {
      const response = await loadGroupInfo(id)
      if (!response.success) {
        toast(`❌ 게시판 그룹 설정 및 소속 게시판들을 가져오지 못했습니다: ${response.error}`)
        return
      }
      groupInfo.value = response.result
    } catch (e) {
      toast(`❌ 게시판 그룹 설정 및 소속 게시판들을 가져오지 못했습니다: ${e}`)
    }
  }

  // 그룹명 변경하기 다이얼로그 띄우기
  const openChangeGroupIdDialog = (groupUid: number) => {
    targetGroupUid.value = groupUid
    isGroupNameChangeDialog.value = true
  }

  // 그룹명 변경하기 다이얼로그 닫기
  const closeChangeGroupIdDialog = () => {
    targetGroupUid.value = 0
    isGroupNameChangeDialog.value = false
  }

  // 그룹명 변경하기
  const changeGroupId = async (newGroupId: string): Promise<boolean> => {
    try {
      const response = await updateGroupId(targetGroupUid.value, newGroupId)
      if (!response.success) {
        toast(`❌ 그룹명을 ${newGroupId}(으)로 변경하지 못했습니다: ${response.error}`)
        return false
      }
      toast(`✅ 그룹명을 ${newGroupId}(으)로 변경하였습니다`)
      return true
    } catch (e) {
      toast(`❌ 그룹명을 ${newGroupId}(으)로 변경하지 못했습니다: ${e}`)
    }
    return false
  }

  // 새 게시판 생성하기
  const createBoard = async (param: AdminBoardCreateParam): Promise<number> => {
    try {
      const response = await createNewBoard(param)
      if (!response.success) {
        toast(`❌ 새 게시판을 생성하지 못했습니다: ${response.error}`)
        return 0
      }
      toast(`✅ ${param.id} 게시판을 생성하였습니다`)
      return response.result
    } catch (e) {
      toast(`❌ 새 게시판을 생성하지 못했습니다: ${e}`)
    }
    return 0
  }

  // 기존 게시판 수정하기
  const modifyBoard = async (param: AdminBoardModifyParam): Promise<boolean> => {
    try {
      const response = await modifyExistBoard(param)
      if (!response.success) {
        toast(`❌ ${param.id} 게시판 설정을 수정하지 못했습니다: ${response.error}`)
        return false
      }
      toast(`✅ ${param.id} 게시판 설정을 수정하였습니다`)
      return true
    } catch (e) {
      toast(`❌ ${param.id} 게시판 설정을 수정하지 못했습니다: ${e}`)
    }
    return false
  }

  // 기존 게시판 정보 가져오기
  const getBoardConfig = async (id: string): Promise<AdminBoardResult> => {
    let result: AdminBoardResult = { config: BOARD_CONFIG, groups: [] }
    try {
      const response = await loadBoardConfig(id)
      if (!response.success) {
        toast(`❌ ${id} 게시판의 기존 설정값을 가져오지 못했습니다: ${response.error}`)
        return result
      }
      result = response.result
    } catch (e) {
      toast(`❌ ${id} 게시판의 기존 설정값을 가져오지 못했습니다: ${e}`)
    }
    return result
  }

  // 게시판 삭제하기 시 확인용 다이얼로그 창 띄우기
  const openBoardRemoveConfirmDialog = (boardUid: number, boardId: string) => {
    targetBoard.value = { uid: boardUid, name: boardId }
    isBoardRemoveConfirmDialog.value = true
  }

  // 게시판 삭제하기 시 확인용 다이얼로그 창 닫기
  const closeBoardRemoveConfirmDialog = () => {
    targetBoard.value = { uid: 0, name: "" }
    isBoardRemoveConfirmDialog.value = false
  }

  // 게시판 실제로 삭제하기
  const removeBoard = async () => {
    if (targetBoard.value.uid < 1) {
      toast(`⚠️ 삭제할 게시판이 지정되지 않았습니다`)
      return
    }

    try {
      const response = await removeExistBoard(targetBoard.value.uid)
      if (!response.success) {
        toast(`❌ 게시판을 삭제하지 못했습니다: ${response.error}`)
        return
      }
      toast(`✅ 게시판을 정상적으로 삭제하였습니다`)
    } catch (e) {
      toast(`❌ 게시판을 삭제하지 못했습니다: ${e}`)
    }
  }

  return {
    isGroupNameChangeDialog,
    isBoardRemoveConfirmDialog,
    skin,
    menu,
    dashboard,
    uploadUsage,
    latestReports,
    latestComments,
    latestPosts,
    groups,
    groupInfo,
    targetBoard,

    openMenu,
    loadInitDashboard,
    loadInitReportList,
    loadInitCommentList,
    loadInitPostList,
    loadInitGroupList,
    loadSelectedGroupInfo,
    openChangeGroupIdDialog,
    closeChangeGroupIdDialog,
    changeGroupId,
    createBoard,
    modifyBoard,
    getBoardConfig,
    openBoardRemoveConfirmDialog,
    closeBoardRemoveConfirmDialog,
    removeBoard,
  }
})
