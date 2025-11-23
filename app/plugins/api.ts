export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // 클라이언트에서 사용할 API 인스턴스 정의
  const $api = $fetch.create({
    baseURL: config.public.apiBase,

    onRequest({ options }) {
      const headers = useRequestHeaders(["cookie"])
      if (headers.cookie) {
        options.headers = options.headers || {}
        Object.assign(options.headers, { cookie: headers.cookie })
      }
    },

    async onResponseError({ request, response, options }) {
      // 401 (Unauthorized) 에러이고 재시도 중이 아닐 때 액세스 토큰 재발급 후 진행
      if (response.status === 401 && !(options as any)._retry) {
        ;(options as any)._retry = true

        try {
          const auth = useAuthStore()
          const fd = new FormData()
          fd.append("userUid", auth.user.uid.toString())

          await $fetch(`${config.public.apiBase}/auth/refresh`, {
            method: "POST",
            body: fd,
            retry: 0,
          })

          return $fetch(request, options as any)
        } catch (e) {
          void e
          const auth = useAuthStore()
          auth.logout()
          navigateTo("/auth/login")
        }
      }
    },
  })

  return {
    provide: { api: $api },
  }
})
