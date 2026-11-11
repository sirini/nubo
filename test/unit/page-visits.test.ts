import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import type { H3Event } from "h3"

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), cookie: "session-token" }))
vi.mock("ofetch", () => ({ $fetch: mocks.fetch }))
vi.mock("h3", () => ({ getCookie: () => mocks.cookie, getRequestURL: () => new URL("https://example.org/board/news/12?secret=hidden") }))
vi.mock("../../server/utils/requestPeer", () => ({ trustedRequestPeer: () => "192.0.2.5" }))
type RenderHook = (response: { statusCode?: number }, context: { event: H3Event }) => Promise<void>
let render: RenderHook
beforeAll(async () => {
  vi.stubGlobal("defineNitroPlugin", (plugin: (app: unknown) => void) => plugin({ hooks: { hook: (_name: string, callback: RenderHook) => { render = callback } } }))
  vi.stubGlobal("useRuntimeConfig", () => ({ apiBaseInternal: "http://backend/goapi" }))
  await import("../../server/plugins/page-visits")
})
afterEach(() => mocks.fetch.mockReset())

describe("server document access recording", () => {
  it("records the document without URL queries and forwards only validated network identity and session", async () => {
    mocks.fetch.mockResolvedValue({ success: true })
    await render({ statusCode: 200 }, { event: { method: "GET" } as H3Event })
    expect(mocks.fetch).toHaveBeenCalledWith("http://backend/goapi/home/page-visit", expect.objectContaining({
      method: "POST", body: { path: "/board/news/12" },
      headers: { Authorization: "Bearer session-token", "X-Real-IP": "192.0.2.5" }, retry: 0,
    }))
  })
  it("retains anonymous access when the supplied session has expired", async () => {
    mocks.fetch.mockRejectedValueOnce({ statusCode: 401 }).mockResolvedValueOnce({ success: true })
    await render({ statusCode: 200 }, { event: { method: "GET" } as H3Event })
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
    expect(mocks.fetch.mock.calls[1]?.[1].headers).toEqual({ "X-Real-IP": "192.0.2.5" })
  })
  it("leaves non-document failures and HEAD requests uncounted", async () => {
    await render({ statusCode: 404 }, { event: { method: "GET" } as H3Event })
    await render({ statusCode: 200 }, { event: { method: "HEAD" } as H3Event })
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
  it("keeps normal pages available during a recording outage", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {})
    try {
      mocks.fetch.mockRejectedValue(new Error("unavailable"))
      await expect(render({ statusCode: 200 }, { event: { method: "GET" } as H3Event })).resolves.toBeUndefined()
      expect(warning).toHaveBeenCalledOnce()
    } finally { warning.mockRestore() }
  })
})
