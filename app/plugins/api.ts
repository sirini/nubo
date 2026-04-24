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
      options.headers = options.headers || {}
      const headers = options.headers as unknown as Record<string, string>

      if (import.meta.server && reqHeaders.cookie) {
        if (!headers.cookie) {
          headers.cookie = reqHeaders.cookie
        }
      }

      if (tokenCookie.value && !headers.Authorization) {
        headers.Authorization = `Bearer ${tokenCookie.value}`
      }
    },
  })

  // 재시도 로직을 포함한 커스텀 Fetch 함수 정의
  const customFetch = async <T>(request: string, options?: any) => {
    try {
      return await fetchInstance<T>(request, options)
    } catch (error: any) {
      if (error.response?.status === 401 && !options?._retry) {
        options._retry = true // 무한 루프 방지 플래그

        try {
          const fd = new FormData()
          if (authStore.user?.uid) {
            fd.append("userUid", authStore.user.uid.toString())
          }

          const res = await fetchInstance<Resp<string>>(`/auth/refresh`, {
            method: "POST",
            body: fd,
          })

          if (res.result) {
            const newAuthToken = res.result
            tokenCookie.value = newAuthToken // 브라우저/클라이언트에 새 토큰을 저장

            // 재시도 요청을 위한 헤더 강제 설정
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${newAuthToken}`,
            }

            // SSR에서 Go 백엔드가 읽을 cookie 헤더 내의 auth token 교체
            if (import.meta.server) {
              let currentCookie = options.headers.cookie || reqHeaders.cookie || ""
              if (currentCookie.includes(`${AUTH_KEY}=`)) {
                options.headers.cookie = currentCookie.replace(
                  new RegExp(`${AUTH_KEY}=[^;]+`),
                  `${AUTH_KEY}=${newAuthToken}`,
                )
              }
            }

            // 원래 요청 재시도 및 결과 반환
            return await fetchInstance<T>(request, options)
          }

          throw new Error("Refresh Failed")
        } catch (refreshError) {
          authStore.logout() // Refresh 실패 시 로그아웃
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
