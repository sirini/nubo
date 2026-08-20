import { toast } from "vue-sonner"
import { useReport } from "~/composables/useReport.client"

export const useReportStore = defineStore("report", () => {
  const { getReportStatus, sendReport, changeUserBlock } = useReport()
  const description = ref<string>("")
  const isBannedByMe = ref<boolean>(false)
  const isOpenReportForm = ref<boolean>(false)
  const isReported = ref<boolean>(false)
  const selectedReason = ref<string>("")
  const targetUserUid = ref<number>(0)

  // 이미 신고된 건인지, 이미 내 블랙리스트에 추가되었는지 확인
  const loadReportStatus = async (target: number) => {
    try {
      targetUserUid.value = target
      const response = await getReportStatus(target)
      if (!response.success || !response.result) {
        toast(`❌ 신고 여부 및 블랙 리스트 추가 등의 정보를 가져오지 못했습니다: ${response.error}`)
        return
      }
      isReported.value = response.result.isReported
      isBannedByMe.value = response.result.isBannedByMe
    } catch (e) {
      toast(`❌ 신고 여부 및 블랙 리스트 추가 등의 정보를 가져오지 못했습니다: ${e}`)
    }
  }

  // 신고 화면 닫기
  const close = () => {
    isOpenReportForm.value = false
  }

  // 신고 버튼 클릭
  const open = (target: number) => {
    isOpenReportForm.value = true
    targetUserUid.value = target
  }

  // 신고하기 클릭 시 서버로 제출
  const send = async () => {
    if (targetUserUid.value < 1) {
      toast(`⚠️ 신고 대상이 지정되지 않았습니다`)
      return
    }
    if (description.value.length < 10) {
      toast(`⚠️ 신고 사유는 10글자 이상 입력해주세요`)
      return
    }
    try {
      const response = await sendReport(
        targetUserUid.value,
        description.value,
        false,
      )
      if (!response.success) {
        toast(`❌ 신고서를 제출하지 못했습니다: ${response.error}`)
        return
      }
      toast(`✅ 이 사용자를 관리자에게 신고하였습니다`)
    } catch (e) {
      toast(`❌ 신고서를 제출하지 못했습니다: ${e}`)
    } finally {
      isOpenReportForm.value = false
      targetUserUid.value = 0
    }
  }

  // 신고 여부와 무관하게 차단 상태만 독립적으로 변경한다.
  const toggleBlock = async () => {
    if (targetUserUid.value < 1) {
      toast(`⚠️ 차단 대상이 지정되지 않았습니다`)
      return
    }
    const shouldBlock = !isBannedByMe.value
    try {
      const response = await changeUserBlock(targetUserUid.value, shouldBlock)
      if (!response.success) {
        toast(`❌ 차단 설정을 변경하지 못했습니다: ${response.error}`)
        return
      }
      isBannedByMe.value = shouldBlock
      toast(shouldBlock ? `✅ 사용자를 차단했습니다` : `✅ 사용자 차단을 해제했습니다`)
    } catch (e) {
      toast(`❌ 차단 설정을 변경하지 못했습니다: ${e}`)
    }
  }

  return {
    description,
    isBannedByMe,
    isOpenReportForm,
    isReported,
    selectedReason,
    targetUserUid,

    loadReportStatus,
    close,
    open,
    send,
    toggleBlock,
  }
})
