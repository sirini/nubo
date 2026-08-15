export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    await auth.getInitUserInfo()
  }
  if (!auth.isLoggedIn) {
    return navigateTo(`/auth/login?redirect=${to.fullPath}`)
  }
})
