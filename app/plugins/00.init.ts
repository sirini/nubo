export default defineNuxtPlugin(async (nuxtApp) => {
  const { addVisitHistory } = useHome()
  const auth = useAuthStore()

  try {
    if (!auth.isLoggedIn) {
      await auth.getInitUserInfo()
    }

    addVisitHistory(auth.user.uid)
  } catch (e) {
    console.error(e)
  }
})
