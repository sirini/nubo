import { toast } from "vue-sonner"
import type { BoardWriterLatestComment, BoardWriterLatestPost } from "~/types/board"
import {
  MY_INFO_RESULT,
  USER_INFO_RESULT,
  type UserInfoResult,
  type UserMyResult,
} from "~/types/user"

export const useAuthStore = defineStore("auth", () => {
  const { loadInitUserInfo, loadInitOtherUserInfo, doLogin, doLogout, updateRefreshToken } =
    useAuth()
  const { loadInitUserLatestContent } = useBoard()
  const isAdmin = computed(() => user.value.uid === 1)
  const isLoggedIn = computed(() => user.value.uid > 0)
  const newProfile = ref<File | undefined>(undefined)
  const user = useState<UserMyResult>("user-state", () => MY_INFO_RESULT)
  const otherUser = ref<UserInfoResult>(USER_INFO_RESULT)
  const userLatestPosts = ref<BoardWriterLatestPost[]>([])
  const userLatestComments = ref<BoardWriterLatestComment[]>([])

  // 서버에서 사용자 정보를 기존 토큰 정보로 가져오기
  const getInitUserInfo = async () => {
    try {
      const response = await loadInitUserInfo()
      if (!response.success || !response.result) {
        return await logout()
      }

      user.value = response.result
      user.value.signature = decodeURIComponent(user.value.signature)
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
    } catch (e) {
      void e
    } finally {
      user.value = MY_INFO_RESULT
    }
  }

  // 액세스 토큰 업데이트
  const updateAccessToken = async () => {
    try {
      const response = await updateRefreshToken(user.value.uid)
      if (!response || !response.success) {
        await logout()
        return false
      }
      return true
    } catch (e) {
      await logout()
      void e
    }
    return false
  }

  return {
    isAdmin,
    isLoggedIn,
    newProfile,
    user,
    otherUser,
    userLatestPosts,
    userLatestComments,

    getInitUserInfo,
    getInitOtherUserInfo,
    getInitUserLatestContent,
    login,
    logout,
    updateAccessToken,
  }
})
