import type {
  AdminDashboardItem,
  AdminDashboardLatest,
  AdminDashboardStatisticResult,
} from "~/types/admin"
import type { Resp } from "~/types/common"

export const useAdmin = () => {
  const config = useRuntimeConfig()

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

  // 최신 게시글/댓글/신고 가져오기
  const loadGeneralLatest = async (limit: number) => {
    return await reqGet<Resp<AdminDashboardLatest>>("/admin/dashboard/latest", {
      limit,
    })
  }

  // 업로드 폴더 사용량 가져오기
  const loadGeneralUploadUsage = async (path: string) => {
    return await reqGet<Resp<number>>("/admin/dashboard/usage", {
      path,
    })
  }

  return {
    loadGeneralStatistic,
    loadGeneralItem,
    loadGeneralLatest,
    loadGeneralUploadUsage,
  }
}
