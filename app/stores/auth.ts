import { toast } from "vue-sonner"
import type { BoardWriterLatestComment, BoardWriterLatestPost } from "~/types/board"
import {
  EDIT_PROFILE_PARAM,
  type EditProfileParam,
  MY_INFO_RESULT,
  USER_INFO_RESULT,
  type UserInfoResult,
  type UserMyResult,
} from "~/types/user"

export const useAuthStore = defineStore("auth", () => {
  const {
    loadInitUserInfo,
    loadInitOtherUserInfo,
    doLogin,
    doLogout,
    deleteMyAccount,
    updateMyInfo,
  } = useAuth()
  const { loadInitUserLatestContent } = useBoard()
  const user = useState<UserMyResult>("user-state", () => MY_INFO_RESULT)
  const isLoggedIn = computed(() => user.value.uid > 0)
  const isLoading = ref<boolean>(false)
  const isAdmin = computed(() => user.value.uid === 1)
  const otherUser = ref<UserInfoResult>(USER_INFO_RESULT)
  const userLatestPosts = ref<BoardWriterLatestPost[]>([])
  const userLatestComments = ref<BoardWriterLatestComment[]>([])
  const editProfile = ref<EditProfileParam>(EDIT_PROFILE_PARAM)

  // 서버에서 사용자 정보를 기존 토큰 정보로 가져오기
  const getInitUserInfo = async () => {
    try {
      const response = await loadInitUserInfo()
      if (!response || !response.success || !response.result) {
        return
      }

      user.value = response.result
      user.value.name = recoverChars(user.value.name)
      user.value.signature = recoverChars(user.value.signature)
    } catch (e) {
      toast(`❌ 사용자 정보를 가져오지 못했습니다: ${e}`)
    }
  }

  // 서버에서 다른 사용자의 정보를 가져오기
  const getInitOtherUserInfo = async (targetUserUid: number) => {
    try {
      const response = await loadInitOtherUserInfo(targetUserUid)
      if (!response || !response.success || !response.result) {
        toast(`❌ 다른 사용자의 공개 정보를 가져오지 못했습니다: ${response?.error}`)
        return
      }
      otherUser.value = response.result
      editProfile.value.nickname = recoverChars(otherUser.value.name)
      editProfile.value.profile = otherUser.value.profile
      editProfile.value.signature = recoverChars(otherUser.value.signature)
    } catch (e) {
      toast(`❌ 다른 사용자의 공개 정보를 가져오지 못했습니다: ${e}`)
    }
  }

  // 서버에서 특정 사용자의 최근 (댓)글들 가져오기
  const getInitUserLatestContent = async (targetUserUid: number, limit: number) => {
    try {
      const response = await loadInitUserLatestContent(targetUserUid, limit)
      if (!response || !response.success || !response.result) {
        toast(`❌ 다른 사용자의 최근 활동들을 가져오지 못했습니다: ${response?.error}`)
        return
      }
      const { posts, comments } = response.result
      userLatestPosts.value = posts
      userLatestComments.value = comments
    } catch (e) {
      toast(`❌ 다른 사용자의 최근 활동들을 가져오지 못했습니다: ${e}`)
      return
    }
  }

  // 로그인
  const login = async (email: string, password: string, redirect: string = "/") => {
    if (isLoggedIn.value) return
    try {
      const response = await doLogin(email, password)
      if (!response.success) {
        toast(`❌ 로그인에 실패하였습니다: ${response?.error}`)
        return
      }

      user.value = response.result
      await navigateTo(redirect)
    } catch (e) {
      toast(`❌ 로그인에 실패하였습니다: ${e}`)
    }
  }

  // 로그아웃
  const logout = async () => {
    try {
      await doLogout()
    } finally {
      user.value = MY_INFO_RESULT
    }
  }

  // 삭제가 성공한 경우에만 브라우저의 로그인 상태를 비운다.
  const deleteAccount = async () => {
    const response = await deleteMyAccount()
    if (response.success) {
      user.value = MY_INFO_RESULT
      otherUser.value = USER_INFO_RESULT
      userLatestPosts.value = []
      userLatestComments.value = []
    }
    return response
  }

  // 서버 세션이 만료된 경우 API 호출 없이 클라이언트의 로그인 상태만 정리합니다.
  const expireLocalSession = () => {
    user.value = MY_INFO_RESULT
  }

  // 내 프로필 정보 업데이트
  const update = async () => {
    try {
      isLoading.value = true
      const response = await updateMyInfo({
        name: editProfile.value.nickname,
        signature: editProfile.value.signature,
        password: editProfile.value.password1,
        profile: editProfile.value.newProfile,
      })
      if (!response.success) {
        toast(`❌ 내 프로필 정보를 업데이트하지 못했습니다: ${response.error}`)
        return
      }
      if (user.value.uid === otherUser.value.uid) {
        otherUser.value.name = editProfile.value.nickname
        otherUser.value.signature = editProfile.value.signature
      } else {
        user.value.name = editProfile.value.nickname
        user.value.signature = editProfile.value.signature
      }
      toast(`✅ 내 프로필 정보를 성공적으로 수정하였습니다`)
    } catch (e) {
      toast(`❌ 내 프로필 정보를 업데이트하지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  return {
    isAdmin,
    isLoggedIn,
    isLoading,
    user,
    otherUser,
    userLatestPosts,
    userLatestComments,
    editProfile,

    getInitUserInfo,
    getInitOtherUserInfo,
    getInitUserLatestContent,
    login,
    logout,
    deleteAccount,
    expireLocalSession,
    update,
  }
})
