import type {
  AdminBoardCreateParam,
  AdminBoardModifyParam,
  AdminBoardResult,
  AdminDashboardItem,
  AdminDashboardStatisticResult,
  AdminGroupConfig,
  AdminGroupListResult,
  AdminLatestComment,
  AdminLatestParam,
  AdminLatestPost,
  AdminMailStatus,
  AdminMailCampaign,
  AdminMailCampaignList,
  AdminMailCampaignPreview,
  AdminMailDeliveryList,
  AdminReportListResult,
  AdminReportSearchParam,
  AdminUserCreateParam,
  AdminUserInfo,
  AdminUserListResult,
  AdminUserModifyParam,
  AdminUserParam,
} from "~/types/admin"
import type { Resp } from "~/types/common"
import type { BoardWriter } from "~/types/board"

export const useAdmin = () => {
  const config = useRuntimeConfig()

  // 간단 통계 데이터 가져오기
  const loadGeneralStatistic = async (days: number) => {
    return await $fetch<Resp<AdminDashboardStatisticResult>>("/admin/dashboard/statistic", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: {
        limit: days,
      },
    })
  }

  // 그룹/게시판/회원 최신 목록 가져오기
  const loadGeneralItem = async (limit: number) => {
    return await $fetch<Resp<AdminDashboardItem>>("/admin/dashboard/item", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { limit },
    })
  }

  // 업로드 폴더 사용량 가져오기
  const loadGeneralUploadUsage = async () => {
    return await $fetch<Resp<number>>("/admin/dashboard/usage", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
  }

  const loadMailStatus = async () => {
    return await $fetch<Resp<AdminMailStatus>>("/admin/system/mail", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
  }

  const previewMailCampaign = async (subject: string, markdown: string) => {
    return await $fetch<Resp<AdminMailCampaignPreview>>("/admin/mail/preview", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: { subject, markdown },
    })
  }

  const saveMailCampaign = async (campaign: Pick<AdminMailCampaign, "uid" | "subject" | "markdown">) => {
    return await $fetch<Resp<AdminMailCampaign>>("/admin/mail/campaign", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: campaign,
    })
  }

  const loadMailCampaigns = async (limit = 20) => {
    return await $fetch<Resp<AdminMailCampaignList>>("/admin/mail/campaigns", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { limit },
    })
  }

  const loadMailCampaign = async (uid: number) => {
    return await $fetch<Resp<AdminMailCampaign>>(`/admin/mail/campaign/${uid}`, {
      baseURL: config.public.apiBase,
      method: "GET",
    })
  }

  const loadMailDeliveries = async (page = 1, limit = 20) => {
    return await $fetch<Resp<AdminMailDeliveryList>>("/admin/mail/deliveries", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { page, limit },
    })
  }

  const sendMailCampaignTest = async (uid: number) => {
    return await $fetch<Resp<null>>(`/admin/mail/campaign/${uid}/test`, {
      baseURL: config.public.apiBase,
      method: "POST",
    })
  }

  const prepareMailCampaign = async (uid: number) => {
    return await $fetch<Resp<AdminMailCampaign>>(`/admin/mail/campaign/${uid}/prepare`, {
      baseURL: config.public.apiBase,
      method: "POST",
    })
  }

  const sendMailCampaign = async (uid: number) => {
    return await $fetch<Resp<AdminMailCampaign>>(`/admin/mail/campaign/${uid}/send`, {
      baseURL: config.public.apiBase,
      method: "POST",
    })
  }

  // 최근 신고 목록 가져오기
  const loadReportList = async (param: AdminReportSearchParam) => {
    return await $fetch<Resp<AdminReportListResult>>("/admin/report/reports", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
  }

  // 최근 댓글 목록 가져오기
  const loadCommentList = async (param: AdminLatestParam) => {
    return await $fetch<Resp<AdminLatestComment[]>>("/admin/latest/comments", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
  }

  // 최근 게시글 목록 가져오기
  const loadPostList = async (param: AdminLatestParam) => {
    return await $fetch<Resp<AdminLatestPost[]>>("/admin/latest/posts", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
  }

  // 게시판 그룹 목록 가져오기
  const loadGroupList = async () => {
    return await $fetch<Resp<AdminGroupConfig[]>>("/admin/group/list", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
  }

  // 선택한 그룹의 설정 및 소속 게시판들 가져오기
  const loadGroupInfo = async (id: string) => {
    return await $fetch<Resp<AdminGroupListResult>>("/admin/group/load", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { id },
    })
  }

  // 기존 게시판 설정 가져오기
  const loadBoardConfig = async (id: string) => {
    return await $fetch<Resp<AdminBoardResult>>("/admin/board/load", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { id },
    })
  }

  const loadAdminCandidates = async (scope: "board" | "group", name: string, limit = 10) => {
    return await $fetch<Resp<BoardWriter[]>>(`/admin/${scope}/candidates`, {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { name, limit },
    })
  }

  const modifyGroupAdmin = async (groupUid: number, targetUserUid: number) => {
    const body = new FormData()
    body.append("groupUid", String(groupUid))
    body.append("targetUserUid", String(targetUserUid))
    return await $fetch<Resp<null>>("/admin/group/admin", {
      baseURL: config.public.apiBase,
      method: "POST",
      body,
    })
  }

  // 새 그룹 생성하기
  const createNewGroup = async (newGroupId: string) => {
    return await $fetch<Resp<AdminGroupConfig>>("/admin/group/create", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: { newGroupId },
    })
  }

  // 그룹명(ID) 변경하기
  const updateGroupId = async (groupUid: number, newGroupId: string) => {
    return await $fetch<Resp<null>>("/admin/group/update", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: {
        groupUid,
        newGroupId,
      },
    })
  }

  // 그룹 삭제하기
  const removeExistGroup = async (groupUid: number) => {
    return await $fetch<Resp<null>>("/admin/group/remove", {
      baseURL: config.public.apiBase,
      method: "DELETE",
      query: { groupUid },
    })
  }

  // 새 게시판 생성하기
  const createNewBoard = async (param: AdminBoardCreateParam) => {
    return await $fetch<Resp<number>>("/admin/board/create", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: param,
    })
  }

  // 기존 게시판 수정하기
  const modifyExistBoard = async (param: AdminBoardModifyParam) => {
    return await $fetch<Resp<null>>("/admin/board/modify", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: param,
    })
  }

  // 기존 게시판 삭제하기
  const removeExistBoard = async (boardUid: number) => {
    return await $fetch<Resp<null>>("/admin/board/remove", {
      baseURL: config.public.apiBase,
      method: "DELETE",
      query: { boardUid },
    })
  }

  // 사용자 목록 가져오기
  const loadUserList = async (param: AdminUserParam) => {
    return await $fetch<Resp<AdminUserListResult>>("/admin/user/list", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
  }

  // 사용자 정보 가져오기
  const loadUserInfo = async (userUid: number) => {
    return await $fetch<Resp<AdminUserInfo>>("/admin/user/load", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { userUid },
    })
  }

  // 사용자 정보 수정하기
  const modifyUserInfo = async (param: AdminUserModifyParam) => {
    const fd = new FormData()
    fd.append("userUid", param.userUid.toString())
    fd.append("name", param.name)
    fd.append("password", param.password)
    fd.append("level", param.level.toString())
    fd.append("point", param.point.toString())
    fd.append("oldProfile", param.oldProfile)
    fd.append("signature", param.signature)

    if (param.profile) {
      fd.append("profile", param.profile)
    }
    return await $fetch<Resp<null>>("/admin/user/modify", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: fd,
    })
  }

  // 사용자 삭제하기
  const removeUserAccount = async (userUid: number) => {
    return await $fetch<Resp<null>>("/admin/user/remove", {
      baseURL: config.public.apiBase,
      method: "DELETE",
      query: { userUid },
    })
  }

  // 새 사용자 계정 추가하기
  const createUserAccount = async (param: AdminUserCreateParam) => {
    const fd = new FormData()
    fd.append("id", param.id)
    fd.append("name", param.name)
    fd.append("password", param.password)
    fd.append("level", param.level.toString())
    fd.append("point", param.point.toString())
    fd.append("signature", param.signature)

    if (param.profile) {
      fd.append("profile", param.profile)
    }
    return await $fetch<Resp<number>>("/admin/user/create", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: fd,
    })
  }

  return {
    createNewBoard,
    createNewGroup,
    createUserAccount,
    loadBoardConfig,
    loadAdminCandidates,
    loadCommentList,
    loadGeneralItem,
    loadGeneralStatistic,
    loadGeneralUploadUsage,
    loadMailStatus,
    loadMailCampaign,
    loadMailDeliveries,
    loadMailCampaigns,
    loadGroupInfo,
    loadGroupList,
    loadPostList,
    loadReportList,
    loadUserInfo,
    loadUserList,
    modifyExistBoard,
    modifyGroupAdmin,
    modifyUserInfo,
    prepareMailCampaign,
    previewMailCampaign,
    removeExistBoard,
    removeExistGroup,
    removeUserAccount,
    saveMailCampaign,
    sendMailCampaign,
    sendMailCampaignTest,
    updateGroupId,
  }
}
