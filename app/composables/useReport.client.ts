import type { Resp } from "~/types/common"
import type { UserCheckReportResult } from "~/types/user"

export const useReport = () => {
  const config = useRuntimeConfig()
  const { reqPost, reqGet } = useApi()

  // 이미 신고한 사용자인지, 이미 내 블랙리스트에 추가한 사용자인지 확인
  const getReportStatus = async (targetUserUid: number) => {
    return await reqGet<Resp<UserCheckReportResult>>("/auth/user/report", {
      targetUserUid,
    })
  }

  // 특정 사용자를 신고하기
  const sendReport = async (targetUserUid: number, content: string, checkedBlackList: boolean) => {
    return await reqPost<Resp<null>>("/auth/user/report", {
      targetUserUid,
      content,
      checkedBlackList,
    })
  }

  // 신고와 별개로 사용자를 차단하거나 차단 해제한다.
  const changeUserBlock = async (targetUserUid: number, blocked: boolean) => {
    return await $fetch<Resp<null>>("/auth/user/block", {
      baseURL: config.public.apiBase,
      method: blocked ? "PUT" : "DELETE",
      body: { targetUserUid },
    })
  }

  return {
    getReportStatus,
    sendReport,
    changeUserBlock,
  }
}
