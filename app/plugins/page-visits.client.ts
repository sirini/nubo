export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  let ready = false
  const record = (path: string) => {
    void $fetch("/home/page-visit", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: { path },
    }).catch(() => { console.warn("접속 기록을 저장하지 못했습니다.") })
  }
  nuxtApp.hook("app:mounted", () => {
    ready = true
  })
  router.afterEach((to, from, failure) => {
    if (ready && !failure && to.path !== from.path) record(to.path)
  })
  // A login on the same page must also link the newly authenticated visitor.
  watch(() => auth.user.uid, (uid, previous) => {
    if (ready && uid !== previous) record(router.currentRoute.value.path)
  })
})
