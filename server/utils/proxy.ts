// server/utils/proxy.ts
import { AUTH_KEY, CODE } from "~/types/common"

export const safeProxyRequest = async (event: any, targetUrl: string) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_KEY)
  const method = event.node.req.method
  const query = getQuery(event)
  const contentType = getHeader(event, "content-type")

  // 요청 데이터를 스트림이 아닌 '원시 바이너리 Buffer' 형태로 메모리에 통째로 복사 (POST FormData용)
  const rawBody =
    method !== "GET" && method !== "HEAD"
      ? await readRawBody(event, false).catch(() => undefined)
      : undefined

  const fetchUrl = targetUrl as any

  // 메모리에 박제해 둔 rawBody 버퍼를 실어서 백엔드에 1차 요청
  let response = await $fetch.raw(fetchUrl, {
    method,
    body: rawBody,
    query,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(contentType ? { "content-type": contentType } : {}), // 원본 멀티파트 헤더 토스
    },
    ignoreResponseError: true,
  })

  // 만약 백엔드가 401 Unauthorized를 반환했다면 가로채서 토큰 갱신 진행
  if (response.status === 401) {
    try {
      const reqHeaders = useRequestHeaders(["cookie"])
      const refreshUrl = `${config.apiBaseInternal}/auth/refresh` as any

      const refreshResult = await $fetch<{
        success: boolean
        error: string
        code: number
        result: any
      }>(refreshUrl, {
        method: "POST",
        headers: { ...reqHeaders },
      })

      if (refreshResult && refreshResult.success) {
        const newToken = refreshResult.result as string

        // 만료되었을 때, 소멸한 스트림 대신 메모리의 rawBody 버퍼 사용
        response = await $fetch.raw(fetchUrl, {
          method,
          body: rawBody,
          query,
          headers: {
            Authorization: `Bearer ${newToken}`,
            ...(contentType ? { "content-type": contentType } : {}),
          },
          ignoreResponseError: true,
        })
      }
    } catch (refreshError) {
      event.node.res.statusCode = 401
      return { success: false, error: "Session Expired", code: CODE.EXPIRED, result: null }
    }
  }

  // 최종 결과 세팅
  event.node.res.statusCode = response.status

  const setCookieHeader = response.headers.get("set-cookie")
  if (setCookieHeader) {
    appendHeader(event, "set-cookie", setCookieHeader)
  }

  return response._data
}
