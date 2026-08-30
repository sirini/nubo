import { createEvent, type H3Event } from "h3"
import { IncomingMessage, ServerResponse } from "node-mock-http"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { safeProxyRequest } from "../../server/utils/proxy"

const { fetchRaw } = vi.hoisted(() => ({ fetchRaw: vi.fn() }))

vi.mock("ofetch", () => ({
  $fetch: { raw: fetchRaw },
}))

type ProxyResponse = {
  status: number
  _data: unknown
  headers: Headers
}

const response = (status: number, data: unknown, cookies: string[] = []): ProxyResponse => {
  const headers = new Headers()
  for (const cookie of cookies) headers.append("set-cookie", cookie)
  return { status, _data: data, headers }
}

const eventFor = ({
  body,
  cookie = "",
  method = "GET",
  url = "/api/test",
}: {
  body?: Buffer
  cookie?: string
  method?: string
  url?: string
} = {}) => {
  const request = new IncomingMessage()
  request.method = method
  request.url = url
  request.headers = {
    ...(cookie ? { cookie } : {}),
    ...(body ? { "content-type": "application/octet-stream" } : {}),
  }
  if (body) Object.assign(request, { body })

  const nodeResponse = new ServerResponse(request)
  return {
    event: createEvent(request, nodeResponse) as H3Event,
    response: nodeResponse,
  }
}

describe("safeProxyRequest token refresh", () => {
  beforeEach(() => {
    fetchRaw.mockReset()
  })

  afterEach(async () => {
    await Promise.resolve()
  })

  it("refreshes once, forwards cookies, and replays the exact request body", async () => {
    const rawBody = Buffer.from([0, 1, 2, 255])
    const cookie = "nubo-auth-token=expired; nubo-refresh-token=refresh-value"
    const { event, response: nodeResponse } = eventFor({
      body: rawBody,
      cookie,
      method: "POST",
      url: "/api/test?page=2",
    })

    fetchRaw
      .mockResolvedValueOnce(response(401, { success: false }))
      .mockResolvedValueOnce(
        response(200, { success: true, error: "", code: 0, result: "renewed-access" }, [
          "nubo-auth-token=renewed-access; Path=/; HttpOnly",
          "nubo-refresh-token=rotated; Path=/; HttpOnly",
        ]),
      )
      .mockResolvedValueOnce(
        response(200, { success: true, result: "proxied" }, ["backend-cookie=value; Path=/"]),
      )

    const result = await safeProxyRequest(event, "http://backend.test/resource")

    expect(result).toEqual({ success: true, result: "proxied" })
    expect(nodeResponse.statusCode).toBe(200)
    expect(fetchRaw).toHaveBeenCalledTimes(3)

    const [firstUrl, firstOptions] = fetchRaw.mock.calls[0]!
    const [refreshUrl, refreshOptions] = fetchRaw.mock.calls[1]!
    const [retryUrl, retryOptions] = fetchRaw.mock.calls[2]!
    expect(firstUrl).toBe("http://backend.test/resource")
    expect(firstOptions.body).toEqual(rawBody)
    expect(firstOptions.query).toEqual({ page: "2" })
    expect(firstOptions.headers.Authorization).toBe("Bearer expired")
    expect(refreshUrl).toMatch(/\/auth\/refresh$/)
    expect(refreshOptions.headers.cookie).toBe(cookie)
    expect(retryUrl).toBe(firstUrl)
    expect(retryOptions.body).toBe(firstOptions.body)
    expect(retryOptions.headers.Authorization).toBe("Bearer renewed-access")
    expect(nodeResponse.getHeader("set-cookie")).toEqual([
      "nubo-auth-token=renewed-access; Path=/; HttpOnly",
      "nubo-refresh-token=rotated; Path=/; HttpOnly",
      "backend-cookie=value; Path=/",
    ])
  })

  it("returns the stable expired-session response when refresh is unavailable", async () => {
    const { event, response: nodeResponse } = eventFor()
    fetchRaw.mockResolvedValueOnce(response(401, { success: false }))

    await expect(safeProxyRequest(event, "http://backend.test/resource")).resolves.toEqual({
      success: false,
      error: "Session Expired",
      code: 8,
      result: null,
    })
    expect(nodeResponse.statusCode).toBe(401)
    expect(fetchRaw).toHaveBeenCalledTimes(1)
  })

  it("deduplicates concurrent refreshes for the same cookie", async () => {
    let resolveRefresh!: (value: ProxyResponse) => void
    const refreshResponse = new Promise<ProxyResponse>((resolve) => {
      resolveRefresh = resolve
    })
    let refreshCalls = 0

    fetchRaw.mockImplementation((url: string, options: { headers?: Record<string, string> }) => {
      if (url.endsWith("/auth/refresh")) {
        refreshCalls++
        return refreshResponse
      }
      if (options.headers?.Authorization === "Bearer renewed-access") {
        return Promise.resolve(response(200, { success: true }))
      }
      return Promise.resolve(response(401, { success: false }))
    })

    const cookie = "nubo-auth-token=expired; nubo-refresh-token=shared-refresh"
    const first = eventFor({ cookie })
    const second = eventFor({ cookie })
    const firstRequest = safeProxyRequest(first.event, "http://backend.test/first")
    const secondRequest = safeProxyRequest(second.event, "http://backend.test/second")

    await vi.waitFor(() => expect(refreshCalls).toBe(1))
    resolveRefresh(
      response(200, { success: true, error: "", code: 0, result: "renewed-access" }),
    )

    await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
      { success: true },
      { success: true },
    ])
    expect(refreshCalls).toBe(1)
    expect(fetchRaw).toHaveBeenCalledTimes(5)
  })

  it("forwards the studio JWT and query contract to the matching GOAPI path", async () => {
    const cookie = "nubo-auth-token=studio-access; nubo-refresh-token=studio-refresh"
    const { event } = eventFor({
      cookie,
      url: "/api/board/my/studio?id=photo&page=2&limit=20&sort=likes",
    })
    fetchRaw.mockResolvedValueOnce(
      response(200, {
        success: true,
        error: "",
        code: 0,
        result: {
          summary: {
            postCount: 0,
            photoCount: 0,
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
          },
          posts: { page: 2, limit: 20, totalCount: 0, hasNext: false, items: [] },
        },
      }),
    )

    await safeProxyRequest(event, "http://backend.test/board/my/studio")

    expect(fetchRaw).toHaveBeenCalledTimes(1)
    const [url, options] = fetchRaw.mock.calls[0]!
    expect(url).toBe("http://backend.test/board/my/studio")
    expect(options.method).toBe("GET")
    expect(options.body).toBeUndefined()
    expect(options.query).toEqual({ id: "photo", page: "2", limit: "20", sort: "likes" })
    expect(options.headers.Authorization).toBe("Bearer studio-access")
  })
})
