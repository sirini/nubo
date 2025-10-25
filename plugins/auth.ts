export default defineNuxtPlugin(async (nuxtApp) => {
  const auth = useAuthStore()

  if (auth.isLoggedIn) return

  const token = useCookie("auth-token")
  if (token.value) {
    await auth.loadUserInfo()
  }
})
