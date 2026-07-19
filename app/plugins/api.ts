import { navigateTo } from "#app"

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // 중복 리프레시 방지용 Lock 및 재시도 큐
  let isRefreshing = false
  let refreshSubscribers: (() => void)[] = []

  const onRefreshed = () => {
    refreshSubscribers.forEach((callback) => callback())
    refreshSubscribers = []
  }

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

  // 비동기 재시도와 큐 핸들링이 가능한 래퍼 함수 정의
  const apiFetch = async <T>(request: any, options?: any): Promise<T> => {
    try {
      return await baseFetch<T>(request, { ...options })
    } catch (error: any) {
      if (error?.response?.status === 401) {
        // 리프레시 요청 자체가 401이면 세션 최종 만료
        if (request.toString().includes("/auth/refresh")) {
          if (import.meta.client) {
            navigateTo("/auth/login")
          }
          throw error
        }

        if (import.meta.client) {
          // 토큰 연장 성공 시 실행될 대기 큐 생성
          const retryOriginalRequest = new Promise<T>((resolve, reject) => {
            refreshSubscribers.push(() => {
              // baseFetch가 아니라 래퍼인 apiFetch를 다시 불러 안전하게 재시도
              baseFetch<T>(request, { ...options })
                .then(resolve)
                .catch(reject)
            })
          })

          // 첫 401 요청이 대표로 세션 연장 신청
          if (!isRefreshing) {
            isRefreshing = true

            try {
              const refreshResult = await baseFetch<{
                success: boolean
                error: string
                code: number
                result: any
              }>("/auth/refresh", {
                method: "POST",
              })

              if (refreshResult && refreshResult.success) {
                isRefreshing = false
                onRefreshed() // 대기열 출발
                return retryOriginalRequest
              }
            } catch (refreshError) {
              isRefreshing = false
              refreshSubscribers = []
              navigateTo("/auth/login")
              throw refreshError
            }
          }

          // 후발 주자들은 큐에서 대기
          return retryOriginalRequest
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
