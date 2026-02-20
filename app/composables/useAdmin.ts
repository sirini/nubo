import {
  type AdminBoardCreateParam,
  type AdminDashboardItem,
  type AdminDashboardStatisticResult,
  type AdminGroupConfig,
  type AdminGroupListResult,
  type AdminLatestComment,
  type AdminLatestParam,
  type AdminLatestPost,
  type AdminReportItem,
  type AdminReportParam,
} from "~/types/admin"
import type { Resp } from "~/types/common"

export const useAdmin = () => {
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
  const loadGeneralUploadUsage = async (path: string) => {
    return await reqGet<Resp<number>>("/admin/dashboard/usage", {
      path,
    })
  }

  // 최근 신고 목록 가져오기
  const loadReportList = async (param: AdminReportParam) => {
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
    return await reqGet<Resp<AdminGroupConfig[]>>("/admin/group/list/load", {})
  }

  // 선택한 그룹의 설정 및 소속 게시판들 가져오기
  const loadGroupInfo = async (id: string) => {
    return await reqGet<Resp<AdminGroupListResult>>("/admin/group/general/load", {
      id,
    })
  }

  // 그룹명(ID) 변경하기
  const updateGroupId = async (groupUid: number, newGroupId: string) => {
    return await reqPost<Resp<null>>("/admin/group/list/update", {
      groupUid,
      newGroupId,
    })
  }

  // 새 게시판 생성하기
  const createNewBoard = async (param: AdminBoardCreateParam) => {
    return await reqPost<Resp<number>>("/admin/board/general/create", param)
  }

  return {
    loadGeneralStatistic,
    loadGeneralItem,
    loadGeneralUploadUsage,
    loadReportList,
    loadCommentList,
    loadPostList,
    loadGroupList,
    loadGroupInfo,
    updateGroupId,
    createNewBoard,
  }
}
