import type { Resp } from "~/types/common"
import type { UserCheckReportResult } from "~/types/user"

export const useReport = () => {
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

  return {
    getReportStatus,
    sendReport,
  }
}
