import { toast } from "vue-sonner"
import { MY_INFO_RESULT, type UserMyResult } from "~/types/user"

export const useAuthStore = defineStore("auth", () => {
  const { loadInitUserInfo, doLogin, doLogout, updateRefreshToken } = useAuth()
  const isAdmin = computed(() => user.value.uid === 1)
  const isLoggedIn = computed(() => user.value.uid > 0)
  const newProfile = ref<File | undefined>(undefined)
  const user = useState<UserMyResult>("user-state", () => MY_INFO_RESULT)

  // 서버에서 사용자 정보를 기존 토큰 정보로 가져오기
  const loadUserInfo = async () => {
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

    loadUserInfo,
    login,
    logout,
    updateAccessToken,
  }
})
