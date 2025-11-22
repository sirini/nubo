import { AUTH_KEY } from "~/types/common"

export default defineNuxtPlugin(async (nuxtApp) => {
  const auth = useAuthStore()

  if (auth.isLoggedIn) return

  const token = useCookie(AUTH_KEY)
  if (token.value) {
    await auth.loadUserInfo()
  }
  void nuxtApp
})
