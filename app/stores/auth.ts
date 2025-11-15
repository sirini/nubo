import { toast } from "vue-sonner"
import { MY_INFO_RESULT, type MyInfoResult } from "~/types/user"

export const useAuthStore = defineStore("auth", () => {
  const { fetchUserInfo, fetchLogin, fetchLogout, fetchToken } = useAuth()
  const newProfile = ref<File | undefined>(undefined)
  const user = useState<MyInfoResult>("user-state", () => MY_INFO_RESULT)
  const isLoggedIn = computed(() => user.value.uid > 0)

  // 서버에서 사용자 정보를 기존 토큰 정보로 가져오기
  async function loadUserInfo(): Promise<void> {
    try {
      const response = await fetchUserInfo()
      if (!response || !response.success) {
        return await logout()
      }

      user.value = response.result
      user.value.signature = decodeURIComponent(user.value.signature)
    } catch (e) {
      toast(`사용자 정보를 가져오지 못했습니다: ${e}`)
      await logout()
    }
  }

  // 로그인
  async function login(email: string, password: string): Promise<void> {
    if (isLoggedIn.value) return
    try {
      const response = await fetchLogin(email, password)
      if (!response || !response.success) {
        toast(`로그인에 실패하였습니다: ${response?.error}`)
        return
      }

      user.value = response.result

      await navigateTo("/")
    } catch (e) {
      toast(`로그인에 실패하였습니다: ${e}`)
    }
  }

  // 로그아웃
  async function logout(): Promise<void> {
    try {
      await fetchLogout()
    } catch (e) {
      void e
    }

    user.value = MY_INFO_RESULT
  }

  // 액세스 토큰 업데이트
  async function updateAccessToken(): Promise<boolean> {
    try {
      const response = await fetchToken(user.value.uid)
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
    newProfile,
    user,
    isLoggedIn,

    loadUserInfo,
    login,
    logout,
    updateAccessToken,
  }
})
