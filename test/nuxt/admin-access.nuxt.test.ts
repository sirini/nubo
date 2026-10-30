import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime"
import { describe, expect, it, vi } from "vitest"
import { nextTick } from "vue"
import AdminPage from "../../app/components/admin/AdminPage.vue"

const mocks = vi.hoisted(() => ({
  auth: { isLoggedIn: false, isAdmin: false, getInitUserInfo: vi.fn() },
  openMenu: vi.fn(),
}))
mockNuxtImport("useAuthStore", () => () => mocks.auth)
mockNuxtImport("useAdminStore", () => () => ({ openMenu: mocks.openMenu }))
mockNuxtImport("useSkins", () => () => ({ settings: { value: { admin: "nubo-basic-admin" } } }))
mockNuxtImport("getSkin", () => () => ({ template: '<div data-admin-panel>Admin panel</div>' }))
vi.mock("../../app/providers/admin", () => ({ useAdminProvider: () => ({}) }))

describe("admin access", () => {
  it("waits for session restoration and denies anonymous visitors", async () => {
    let resolveSession!: () => void
    mocks.auth.getInitUserInfo.mockImplementation(() => new Promise<void>((resolve) => { resolveSession = resolve }))
    const wrapper = await mountSuspended(AdminPage, { route: "/admin/members" })
    expect(wrapper.text()).toContain("권한을 확인")
    expect(wrapper.find("[data-admin-panel]").exists()).toBe(false)
    resolveSession()
    await vi.waitFor(() => expect(wrapper.text()).toContain("관리자 계정으로 로그인"))
    expect(wrapper.find("[data-admin-panel]").exists()).toBe(false)
    expect(wrapper.get('a[href*="/auth/login"]').attributes("href")).toContain("redirect=")
    wrapper.unmount()
  })

  it("denies a signed-in user without administrator privileges", async () => {
    mocks.auth.isLoggedIn = true
    mocks.auth.isAdmin = false
    const wrapper = await mountSuspended(AdminPage, { route: "/admin/boards" })
    await nextTick()
    expect(wrapper.get('[role="alert"]').text()).toContain("관리자 계정으로 로그인")
    expect(wrapper.find("[data-admin-panel]").exists()).toBe(false)
    wrapper.unmount()
  })

  it("shows the requested panel for an administrator", async () => {
    mocks.auth.isLoggedIn = true
    mocks.auth.isAdmin = true
    const wrapper = await mountSuspended(AdminPage, { route: "/admin/members" })
    await nextTick()
    expect(wrapper.find("[data-admin-panel]").exists()).toBe(true)
    expect(mocks.openMenu).toHaveBeenCalledWith("User")
    wrapper.unmount()
  })
})
