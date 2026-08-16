import { navigateTo } from "#app"
import { CODE } from "~/types/common"

type FetchFailure = {
  response?: { status?: number }
  data?: { code?: number }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const router = useRouter()

  const preserveDraftAndLogin = async () => {
    const route = router.currentRoute.value
    if (route.path.endsWith("/write")) {
      useEditorStore().flushDraft()
    }
    useAuthStore().expireLocalSession()
    if (route.path === "/auth/login") return
    await navigateTo({ path: "/auth/login", query: { redirect: route.fullPath } })
  }

  // 동시에 여러 요청이 만료되어도 토큰 갱신은 한 번만 실행합니다.
  let refreshPromise: Promise<void> | null = null

  // 기본 뼈대가 되는 순수 ofetch 인스턴스 생성 (훅에서는 최소한의 작업만)
  const baseFetch = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      if (import.meta.server) {
        const headers = useRequestHeaders(["cookie"])
        options.headers = { ...options.headers, ...headers }
      }
    },
  })
  type ApiRequest = Parameters<typeof baseFetch>[0]
  type ApiFetchOptions = Parameters<typeof baseFetch>[1]

  // 비동기 재시도와 큐 핸들링이 가능한 래퍼 함수 정의
  const apiFetch = async <T>(request: ApiRequest, options?: ApiFetchOptions): Promise<T> => {
    try {
      return (await baseFetch<T>(request, { ...options })) as T
    } catch (error: unknown) {
      if ((error as FetchFailure)?.response?.status === 401) {
        // 리프레시 요청 자체가 401이면 세션 최종 만료
        if (request.toString().includes("/auth/refresh")) {
          if (import.meta.client) {
            await preserveDraftAndLogin()
          }
          throw error
        }

        if (import.meta.client) {
          // safeProxyRequest가 이미 갱신을 시도했다면 같은 리프레시 토큰으로 재시도하지 않습니다.
          if ((error as FetchFailure).data?.code === CODE.EXPIRED) {
            await preserveDraftAndLogin()
            throw error
          }
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const refreshResult = await baseFetch<{
                success: boolean
                error: string
                code: number
                result: unknown
              }>("/auth/refresh", {
                method: "POST",
              })

              if (!refreshResult?.success) {
                throw createError({
                  statusCode: 401,
                  statusMessage: refreshResult?.error || "Session refresh failed",
                })
              }
            })().finally(() => {
              refreshPromise = null
            })
          }

          try {
            await refreshPromise
          } catch (refreshError) {
            await preserveDraftAndLogin()
            throw refreshError
          }

          try {
            return (await baseFetch<T>(request, { ...options })) as T
          } catch (retryError: unknown) {
            if ((retryError as FetchFailure)?.response?.status === 401) {
              await preserveDraftAndLogin()
            }
            throw retryError
          }
        }
      }

      // 401 이외의 에러는 그대로 throw
      throw error
    }
  }

  return {
    provide: {
      api: apiFetch, // 기존과 동일하게 제공하므로 useApi 컴포저블 코드 수정 불필요
    },
  }
})
