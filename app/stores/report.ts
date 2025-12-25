import { toast } from "vue-sonner"
import { useReport } from "~/composables/useReport.client"

export const useReportStore = defineStore("report", () => {
  const { getReportStatus, sendReport } = useReport()
  const description = ref<string>("")
  const isBannedByMe = ref<boolean>(false)
  const isCheckedBlackList = ref<boolean>(false)
  const isOpenReportForm = ref<boolean>(false)
  const isReported = ref<boolean>(false)
  const selectedReason = ref<string>("")
  const targetUserUid = ref<number>(0)

  // 이미 신고된 건인지, 이미 내 블랙리스트에 추가되었는지 확인
  const loadReportStatus = async () => {
    if (targetUserUid.value < 1) return

    try {
      const response = await getReportStatus(targetUserUid.value)
      if (!response.success || !response.result) {
        toast(`❌ 신고 여부 및 블랙 리스트 추가 등의 정보를 가져오지 못했습니다: ${response.error}`)
        return
      }
      isReported.value = response.result.isReported
      isBannedByMe.value = response.result.isBannedByMe
      isCheckedBlackList.value = response.result.isBannedByMe
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
      toast(`⚠️ 삭제할 대상이 지정되지 않았습니다`)
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
        isCheckedBlackList.value,
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

  return {
    description,
    isBannedByMe,
    isCheckedBlackList,
    isOpenReportForm,
    isReported,
    selectedReason,
    targetUserUid,

    loadReportStatus,
    close,
    open,
    send,
  }
})
