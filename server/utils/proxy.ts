import { AUTH_KEY } from "~/types/common"

export const safeProxyRequest = async (event: any, targetUrl: string) => {
  const config = useRuntimeConfig()
  let token = getCookie(event, AUTH_KEY)

  // 기존 방식대로 첫 번째 프록시 요청 시도
  let response = await proxyRequest(event, targetUrl, {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  // 만약 GoFiber 백엔드가 401 Unauthorized를 반환했다면 가로채기
  if (event.node.res.statusCode === 401) {
    event.node.res.statusCode = 200 // 임시로 설정

    try {
      // 브라우저가 보낸 쿠키 헤더를 그대로 복사하여 백엔드 refresh 엔드포인트 호출
      const reqHeaders = useRequestHeaders(['cookie'])
      const refreshResult = await $fetch<{ success: boolean, error: string, code: number, result: any }>(
        `${config.apiBaseInternal}/auth/refresh`,
        {
          method: "POST",
          headers: { ...reqHeaders }
        }
      )

      // Goapi가 새로운 토큰 발급에 성공하여 데이터를 내려주었다면
      if (refreshResult && refreshResult.success) {
        const newToken = refreshResult.result as string

        // 새 토큰으로 백엔드에 원본 요청을 "다시 한번" 투명하게 재시도
        return proxyRequest(event, targetUrl, {
          fetchOptions: {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          },
        })
      }
    } catch (refreshError) {
      // 리프레시 토큰마저 완전히 만료된 최후의 상황에는 401을 그대로 뱉음
      event.node.res.statusCode = 401
      return { success: false, message: "Session Expired" }
    }
  }

  return response
}