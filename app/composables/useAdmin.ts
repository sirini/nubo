import {
  type AdminBoardCreateParam,
  type AdminBoardModifyParam,
  type AdminBoardResult,
  type AdminDashboardItem,
  type AdminDashboardStatisticResult,
  type AdminGroupConfig,
  type AdminGroupListResult,
  type AdminLatestComment,
  type AdminLatestParam,
  type AdminLatestPost,
  type AdminReportItem,
  type AdminReportSearchParam,
  type AdminUserCreateParam,
  type AdminUserInfo,
  type AdminUserListResult,
  type AdminUserModifyParam,
  type AdminUserParam,
} from "~/types/admin"
import type { Resp } from "~/types/common"

export const useAdmin = () => {
  const { reqGet, reqPost, reqDelete } = useApi()

  // 간단 통계 데이터 가져오기
  const loadGeneralStatistic = async (days: number) => {
    return await reqGet<Resp<AdminDashboardStatisticResult>>("/admin/dashboard/statistic", {
      limit: days,
    })
  }

  // 그룹/게시판/회원 최신 목록 가져오기
  const loadGeneralItem = async (limit: number) => {
    return await reqGet<Resp<AdminDashboardItem>>("/admin/dashboard/item", {
      limit,
    })
  }

  // 업로드 폴더 사용량 가져오기
  const loadGeneralUploadUsage = async () => {
    return await reqGet<Resp<number>>("/admin/dashboard/usage", {})
  }

  // 최근 신고 목록 가져오기
  const loadReportList = async (param: AdminReportSearchParam) => {
    return await reqGet<Resp<AdminReportItem[]>>("/admin/report/reports", {
      ...param,
    })
  }

  // 최근 댓글 목록 가져오기
  const loadCommentList = async (param: AdminLatestParam) => {
    return await reqGet<Resp<AdminLatestComment[]>>("/admin/latest/comments", {
      ...param,
    })
  }

  // 최근 게시글 목록 가져오기
  const loadPostList = async (param: AdminLatestParam) => {
    return await reqGet<Resp<AdminLatestPost[]>>("/admin/latest/posts", {
      ...param,
    })
  }

  // 게시판 그룹 목록 가져오기
  const loadGroupList = async () => {
    return await reqGet<Resp<AdminGroupConfig[]>>("/admin/group/list", {})
  }

  // 선택한 그룹의 설정 및 소속 게시판들 가져오기
  const loadGroupInfo = async (id: string) => {
    return await reqGet<Resp<AdminGroupListResult>>("/admin/group/load", {
      id,
    })
  }

  // 기존 게시판 설정 가져오기
  const loadBoardConfig = async (id: string) => {
    return await reqGet<Resp<AdminBoardResult>>("/admin/board/load", {
      id,
    })
  }

  // 새 그룹 생성하기
  const createNewGroup = async (newGroupId: string) => {
    return await reqPost<Resp<AdminGroupConfig>>("/admin/group/create", {
      newGroupId,
    })
  }

  // 그룹명(ID) 변경하기
  const updateGroupId = async (groupUid: number, newGroupId: string) => {
    return await reqPost<Resp<null>>("/admin/group/update", {
      groupUid,
      newGroupId,
    })
  }

  // 그룹 삭제하기
  const removeExistGroup = async (groupUid: number) => {
    return await reqDelete<Resp<null>>("/admin/group/remove", {
      groupUid,
    })
  }

  // 새 게시판 생성하기
  const createNewBoard = async (param: AdminBoardCreateParam) => {
    return await reqPost<Resp<number>>("/admin/board/create", param)
  }

  // 기존 게시판 수정하기
  const modifyExistBoard = async (param: AdminBoardModifyParam) => {
    return await reqPost<Resp<null>>("/admin/board/modify", param)
  }

  // 기존 게시판 삭제하기
  const removeExistBoard = async (boardUid: number) => {
    return await reqDelete<Resp<null>>("/admin/board/remove", {
      boardUid,
    })
  }

  // 사용자 목록 가져오기
  const loadUserList = async (param: AdminUserParam) => {
    return await reqGet<Resp<AdminUserListResult>>("/admin/user/list", param)
  }

  // 사용자 정보 가져오기
  const loadUserInfo = async (userUid: number) => {
    return await reqGet<Resp<AdminUserInfo>>("/admin/user/load", {
      userUid,
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
    return await reqPost<Resp<null>>("/admin/user/modify", fd)
  }

  // 사용자 삭제하기
  const removeUserAccount = async (userUid: number) => {
    return await reqDelete<Resp<null>>("/admin/user/remove", {
      userUid,
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
    return await reqPost<Resp<number>>("/admin/user/create", fd)
  }

  return {
    createNewBoard,
    createNewGroup,
    createUserAccount,
    loadBoardConfig,
    loadCommentList,
    loadGeneralItem,
    loadGeneralStatistic,
    loadGeneralUploadUsage,
    loadGroupInfo,
    loadGroupList,
    loadPostList,
    loadReportList,
    loadUserInfo,
    loadUserList,
    modifyExistBoard,
    modifyUserInfo,
    removeExistBoard,
    removeExistGroup,
    removeUserAccount,
    updateGroupId,
  }
}
