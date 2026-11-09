// server/utils/proxy.ts
import {
  appendHeader,
  getCookie,
  getHeader,
  getQuery,
  readRawBody,
  setResponseStatus,
  setHeader,
  type H3Event,
} from "h3"
import { trustedRequestPeer } from "./requestPeer"
import { createHash } from "node:crypto"
import { $fetch as ofetch } from "ofetch"
import { useRuntimeConfig } from "#imports"
import { AUTH_KEY, CODE } from "~/types/common"

type RefreshResult = {
  token: string
  setCookies: string[]
}

const refreshRequests = new Map<string, Promise<RefreshResult>>()

const forwardSetCookies = (event: H3Event, headers: Headers) => {
  for (const cookie of headers.getSetCookie()) {
    appendHeader(event, "set-cookie", cookie)
  }
}

const refreshAccessToken = (refreshUrl: string, cookie: string) => {
  const key = createHash("sha256").update(cookie).digest("hex")
  const pending = refreshRequests.get(key)
  if (pending) return pending

  const request = ofetch
    .raw<{
      success: boolean
      error: string
      code: number
      result: unknown
    }>(refreshUrl, {
      method: "POST",
      headers: { cookie },
      ignoreResponseError: true,
    })
    .then((response) => {
      const result = response._data
      if (response.status !== 200 || !result?.success || typeof result.result !== "string") {
        throw new Error(result?.error || "Session refresh failed")
      }
      return { token: result.result, setCookies: response.headers.getSetCookie() }
    })

  refreshRequests.set(key, request)
  void request.then(
    () => refreshRequests.delete(key),
    () => refreshRequests.delete(key),
  )
  return request
}

const sessionExpired = (event: H3Event) => {
  setResponseStatus(event, 401)
  return { success: false, error: "Session Expired", code: CODE.EXPIRED, result: null }
}

export const safeProxyRequest = async (event: H3Event, targetUrl: string) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_KEY)
  const method = event.node.req.method
  const query = getQuery(event)
  const binaryCSV = query.format === "csv" && /\/admin\/system\/(logs|audit)$/.test(targetUrl)
  const contentType = getHeader(event, "content-type")
  const peer = trustedRequestPeer(event)
  const peerHeader: Record<string, string> = peer ? { "X-Real-IP": peer } : {}

  // 요청 데이터를 스트림이 아닌 '원시 바이너리 Buffer' 형태로 메모리에 통째로 복사 (POST FormData용)
  const rawBody =
    method !== "GET" && method !== "HEAD"
      ? await readRawBody(event, false).catch(() => undefined)
      : undefined

  // 메모리에 박제해 둔 rawBody 버퍼를 실어서 백엔드에 1차 요청
  let response = await ofetch.raw(targetUrl, {
    method,
    body: rawBody,
    query,
    headers: {
      Authorization: `Bearer ${token}`,
      ...peerHeader,
      ...(contentType ? { "content-type": contentType } : {}), // 원본 멀티파트 헤더 토스
    },
    responseType: binaryCSV ? "arrayBuffer" : undefined,
    ignoreResponseError: true,
  })

  // 만약 백엔드가 401 Unauthorized를 반환했다면 가로채서 토큰 갱신 진행
  if (response.status === 401) {
    try {
      const cookie = getHeader(event, "cookie") || ""
      if (!cookie) return sessionExpired(event)
      const refreshUrl = `${config.apiBaseInternal}/auth/refresh`

      const refreshed = await refreshAccessToken(refreshUrl, cookie)
      for (const setCookie of refreshed.setCookies) {
        appendHeader(event, "set-cookie", setCookie)
      }

      // 만료되었을 때, 소멸한 스트림 대신 메모리의 rawBody 버퍼 사용
      response = await ofetch.raw(targetUrl, {
        method,
        body: rawBody,
        query,
        headers: {
          Authorization: `Bearer ${refreshed.token}`,
          ...peerHeader,
          ...(contentType ? { "content-type": contentType } : {}),
        },
        responseType: binaryCSV ? "arrayBuffer" : undefined,
        ignoreResponseError: true,
      })
      if (response.status === 401) return sessionExpired(event)
    } catch {
      return sessionExpired(event)
    }
  }

  // 최종 결과 세팅
  setResponseStatus(event, response.status)

  forwardSetCookies(event, response.headers)
  if (response.headers.get("content-type")?.startsWith("text/csv")) {
    setHeader(event, "Content-Type", "text/csv; charset=utf-8")
    setHeader(event, "Cache-Control", "no-store")
    const disposition = response.headers.get("content-disposition")
    if (disposition) setHeader(event, "Content-Disposition", disposition)
  }

  if (binaryCSV && response._data instanceof ArrayBuffer) {
    if (response.headers.get("content-type")?.startsWith("text/csv")) {
      // Response.text() strips the UTF-8 BOM; pass bytes unchanged for spreadsheet downloads.
      return new Uint8Array(response._data)
    }
    const errorBody = new TextDecoder().decode(response._data)
    try { return JSON.parse(errorBody) } catch { return errorBody }
  }
  return response._data
}
