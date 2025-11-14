import { toast } from "vue-sonner"
import { MY_INFO_RESULT, type MyInfoResult } from "~/types/user"

export const useAuthStore = defineStore("auth", () => {
  const { fetchUserInfo, fetchOAuthUserInfo, fetchLogin, fetchLogout, fetchToken } = useAuth()
  const newProfile = ref<File | undefined>(undefined)
  const user = useState<MyInfoResult>("user-state", () => MY_INFO_RESULT)
  const token = useCookie<string | null>("auth-token", { default: () => null })
  const refresh = useCookie<string | null>("auth-refresh", { default: () => null })
  const isLoggedIn = computed(() => user.value.uid > 0 && !!token.value)

  // 서버에서 사용자 정보를 기존 토큰 정보로 가져오기
  async function loadUserInfo(): Promise<void> {
    if (!token.value) return

    try {
      const response = await fetchUserInfo(token.value)
      if (!response || !response.success) {
        return await logout(false)
      }

      user.value = response.result
      user.value.token = token.value
      user.value.signature = decodeURIComponent(user.value.signature)
    } catch (e) {
      toast(`사용자 정보를 가져오지 못했습니다: ${e}`)
      await logout(false)
    }
  }

  // OAuth 로그인 이후 결과값 가져오기
  async function loadOAuthUserInfo(): Promise<void> {
    try {
      const response = await fetchOAuthUserInfo()
      if (!response || !response.success) {
        toast(`OAuth 로그인 정보 획득 실패: ${response.error}`)
        return
      }

      user.value = response.result
      token.value = response.result.token
      refresh.value = response.result.refresh
    } catch (e) {
      toast(`OAuth 로그인 후 정보를 가져오지 못했습니다: ${e}`)
    }
  }

  // 로그인
  async function login(email: string, password: string): Promise<void> {
    try {
      const response = await fetchLogin(email, password)
      if (!response || !response.success) {
        toast(`로그인 실패: ${response?.error}`)
        return
      }

      user.value = response.result
      token.value = response.result.token
      refresh.value = response.result.refresh

      await navigateTo("/")
    } catch (e) {
      toast(`로그인에 실패하였습니다: ${e}`)
    }
  }

  // 로그아웃
  async function logout(notifyServer = true): Promise<void> {
    if (notifyServer && token.value) {
      try {
        fetchLogout(token.value)
      } catch (e: unknown) {
        void e
      }
    }

    user.value = MY_INFO_RESULT
    token.value = null
    refresh.value = null
  }

  // 액세스 토큰 업데이트
  async function updateAccessToken(): Promise<boolean> {
    if (!refresh.value) return false

    try {
      const response = await fetchToken(user.value.uid, refresh.value)
      if (!response || !response.success) {
        await logout(false)
        return false
      }

      token.value = response.result
      user.value.token = response.result
      return true
    } catch (e) {
      await logout(false)
      void e
    }
    return false
  }

  return {
    newProfile,
    user,
    token,
    refresh,
    isLoggedIn,

    loadUserInfo,
    loadOAuthUserInfo,
    login,
    logout,
    updateAccessToken,
  }
})
