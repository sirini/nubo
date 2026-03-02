import { toast } from "vue-sonner"
import type { NuboProfileContext } from "./contexts/profile"

export const useProfileProvider = (): NuboProfileContext => {
  const auth = useAuthStore()
  const chat = useChatStore()
  const report = useReportStore()

  return {
    isLoggedIn: computed(() => auth.isLoggedIn),
    userLatestPosts: computed(() => auth.userLatestPosts),
    userLatestComments: computed(() => auth.userLatestComments),
    profileUser: computed(() => auth.otherUser),
    myPoint: computed(() => auth.user.point),
    isMe: computed(() => auth.otherUser.uid === auth.user.uid),
    isOpenReportForm: computed({
      get: () => report.isOpenReportForm,
      set: (val) => (report.isOpenReportForm = val),
    }),
    isLoading: computed(() => chat.isLoading),
    chatHistories: computed(() => chat.history),
    chatMyUid: computed(() => auth.user.uid),
    chatMessage: computed({ get: () => chat.message, set: (val: string) => (chat.message = val) }),
    editProfile: computed(() => auth.editProfile),
    reportReasons: computed(() => [
      {
        label: "스팸/광고",
        description: "스팸(광고/홍보), 도배, 타 사이트 홍보, 불법 사이트 링크 작성",
      },
      {
        label: "언어/태도",
        description: "욕설(비속어) 사용, 인신 공격, 비하 발언, 혐오 표현, 분쟁/어그로 유도글 작성",
      },
      {
        label: "정치/사회",
        description: "정치 선동 및 특정 진영 옹호, 정치 관련 분쟁 유도, 사회적 갈등 조장글 작성",
      },
      {
        label: "선정/폭력",
        description:
          "음란물 및 선정적인 내용 작성, 미성년자 관련 부적절한 콘텐츠, 과도한 폭력 및 잔인한 표현, 불쾌감을 주는 이미지 게시",
      },
      {
        label: "사기/허위",
        description: "허위 정보나 가짜 뉴스 작성, 검증되지 않은 정보 유포, 사기 피해 유도",
      },
      {
        label: "기타(직접 입력)",
        description: "",
      },
    ]),
    isReportedUser: computed(() => report.isReported),
    reportReason: computed({
      get: () => report.selectedReason,
      set: (val: string) => (report.selectedReason = val),
    }),
    reportDescription: computed({
      get: () => report.description,
      set: (val: string) => (report.description = val),
    }),
    isCheckedBlackList: computed({
      get: () => report.isCheckedBlackList,
      set: (val) => (report.isCheckedBlackList = val),
    }),
    sendChatMessage: async () => {
      await chat.send(auth.user.uid)
    },
    changeProfileImage: (event: Event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files[0]) {
        auth.editProfile.profile = URL.createObjectURL(target.files[0])
        auth.editProfile.newProfile = target.files[0]
      }
    },
    updateMyProfile: async () => {
      if (auth.editProfile.password1.length > 0 || auth.editProfile.password2.length > 0) {
        const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (
          !pwRegex.test(auth.editProfile.password1) ||
          !pwRegex.test(auth.editProfile.password2)
        ) {
          toast(`⚠️ 비밀번호는 8글자 이상, 영문/숫자/특수기호 조합으로 입력해 주세요`)
          auth.editProfile.password1 = ""
          auth.editProfile.password2 = ""
          return
        }

        if (auth.editProfile.password1 !== auth.editProfile.password2) {
          toast(`⚠️ 입력하신 새 비밀번호가 서로 다릅니다`)
          return
        }
      }
      if (auth.editProfile.nickname.length < 2 || auth.editProfile.nickname.length > 30) {
        toast(`⚠️ 닉네임은 2글자 이상 30글자 미만으로 작성해주세요`)
        return
      }
      auth.user.profile = auth.editProfile.profile
      auth.otherUser.profile = auth.editProfile.profile
      await auth.update()
    },
    openReportForm: (userUid: number) => {
      report.open(userUid)
    },
    reportBadUser: async () => {
      await report.send()
    },
    closeReportForm: () => {
      report.close()
    },
  }
}
