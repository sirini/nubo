// plugins/api.ts
import { AUTH_KEY, type Resp } from "~/types/common"

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const reqHeaders = useRequestHeaders(["cookie"])
  const tokenCookie = useCookie(AUTH_KEY)
  const fetchInstance = $fetch.create({
    baseURL: config.public.apiBase,

    onRequest({ options }) {
      if (import.meta.server && reqHeaders.cookie) {
        options.headers = options.headers || {}
        Object.assign(options.headers, { cookie: reqHeaders.cookie })
      }

      if (tokenCookie.value) {
        options.headers = options.headers || {}
        // @ts-ignore
        options.headers.Authorization = `Bearer ${tokenCookie.value}`
      }
    },
  })

  // 재시도 로직을 포함한 커스텀 Fetch 함수 정의
  const customFetch = async <T>(request: string, options?: any) => {
    try {
      return await fetchInstance<T>(request, options)
    } catch (error: any) {
      if (error.response?.status === 401 && !options?._retry) {
        options = options || {}
        options._retry = true // 무한 루프 방지 플래그

        try {
          const fd = new FormData()
          if (authStore.user?.uid) {
            fd.append("userUid", authStore.user.uid.toString())
          }

          const res = await fetchInstance<Resp<string>>(`${config.public.apiBase}/auth/refresh`, {
            method: "POST",
            body: fd,
          })

          if (res.result) {
            const tokenCookie = useCookie(AUTH_KEY)
            tokenCookie.value = res.result

            options.headers = options.headers || {}
            options.headers.Authorization = `Bearer ${res.result}`

            // 원래 요청 재시도 및 결과 반환
            return await fetchInstance<T>(request, options)
          }

          throw new Error("Refresh Failed")
        } catch (refreshError) {
          authStore.logout()
          await navigateTo(`/auth/login?error=${encodeURIComponent("Expired access token")}`)
          return Promise.reject(refreshError)
        }
      }

      throw error
    }
  }

  return {
    provide: {
      api: customFetch,
    },
  }
})
