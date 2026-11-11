import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const fetch = vi.fn(async () => ({ success: true }))
let mounted: () => void
let navigate: (to: { path: string }, from: { path: string }, failure?: unknown) => void
let identityChanged: (uid: number, previous: number) => void
beforeAll(async () => {
  vi.stubGlobal("$fetch", fetch)
  vi.stubGlobal("useRuntimeConfig", () => ({ public: { apiBase: "/api" } }))
  vi.stubGlobal("useAuthStore", () => ({ user: { uid: 0 } }))
  vi.stubGlobal("watch", (_getter: unknown, callback: typeof identityChanged) => { identityChanged = callback })
  vi.stubGlobal("useRouter", () => ({ currentRoute: { value: { path: "/" } }, afterEach: (callback: typeof navigate) => { navigate = callback } }))
  vi.stubGlobal("defineNuxtPlugin", (plugin: (app: unknown) => void) => plugin({ hook: (_name: string, callback: () => void) => { mounted = callback } }))
  await import("../../app/plugins/page-visits.client")
})
beforeEach(() => fetch.mockClear())
describe("SPA page access recording", () => {
  it("does not duplicate the initial server document record", () => {
    mounted()
    expect(fetch).not.toHaveBeenCalled()
  })
  it("records successful path changes while excluding query-only and failed navigation", () => {
    mounted()
    navigate({ path: "/admin/members" }, { path: "/" })
    expect(fetch).toHaveBeenCalledWith("/home/page-visit", expect.objectContaining({ body: { path: "/admin/members" } }))
    navigate({ path: "/admin/members" }, { path: "/admin/members" })
    navigate({ path: "/admin/logs" }, { path: "/admin/members" }, new Error("aborted"))
    expect(fetch).toHaveBeenCalledOnce()
  })
  it("records identity changes without trusting a browser-supplied UID", () => {
    mounted()
    identityChanged(2, 0)
    expect(fetch).toHaveBeenCalledWith("/home/page-visit", expect.objectContaining({ body: { path: "/" } }))
    identityChanged(2, 2)
    expect(fetch).toHaveBeenCalledOnce()
  })
})
