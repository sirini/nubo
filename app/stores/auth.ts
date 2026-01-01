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
  const { loadInitUserInfo, loadInitOtherUserInfo, doLogin, doLogout, updateMyInfo } = useAuth()
  const { loadInitUserLatestContent } = useBoard()
  const isAdmin = computed(() => user.value.uid === 1)
  const isLoading = ref<boolean>(false)
  const isLoggedIn = computed(() => user.value.uid > 0)
  const user = useState<UserMyResult>("user-state", () => MY_INFO_RESULT)
  const otherUser = ref<UserInfoResult>(USER_INFO_RESULT)
  const userLatestPosts = ref<BoardWriterLatestPost[]>([])
  const userLatestComments = ref<BoardWriterLatestComment[]>([])
  const editProfile = ref<EditProfileParam>(EDIT_PROFILE_PARAM)

  // 서버에서 사용자 정보를 기존 토큰 정보로 가져오기
  const getInitUserInfo = async () => {
    try {
      const response = await loadInitUserInfo()
      if (!response.success || !response.result) {
        return await logout()
      }

      user.value = response.result
      user.value.name = recoverChars(user.value.name)
      user.value.signature = recoverChars(user.value.signature)
    } catch (e) {
      toast(`❌ 사용자 정보를 가져오지 못했습니다: ${e}`)
      await logout()
    }
  }

  // 서버에서 다른 사용자의 정보를 가져오기
  const getInitOtherUserInfo = async (targetUserUid: number) => {
    try {
      const response = await loadInitOtherUserInfo(targetUserUid)
      if (!response.success || !response.result) {
        toast(`❌ 다른 사용자의 공개 정보를 가져오지 못했습니다: ${response.error}`)
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
      if (!response.success || !response.result) {
        toast(`❌ 다른 사용자의 최근 활동들을 가져오지 못했습니다: ${response.error}`)
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
      if (!response || !response.success) {
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
      toast(`✅ 내 프로필 정보를 성공적으로 수정하였습니다`)
    } catch (e) {
      toast(`❌ 내 프로필 정보를 업데이트하지 못했습니다: ${e}`)
    } finally {
      if (user.value.uid === otherUser.value.uid) {
        otherUser.value.name = editProfile.value.nickname
        otherUser.value.signature = editProfile.value.signature
      } else {
        user.value.name = editProfile.value.nickname
        user.value.signature = editProfile.value.signature
      }
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
    update,
  }
})
