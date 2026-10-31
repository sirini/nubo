import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime"
import { describe, expect, it, vi } from "vitest"
import { defineComponent, h, nextTick } from "vue"
import { NuxtPage } from "#components"
import { useRouter } from "#imports"
import AdminPage from "../../app/components/admin/AdminPage.vue"
import AdminIndex from "../../app/pages/admin/index.vue"
import AdminSection from "../../app/pages/admin/[section].vue"
import AdminBoard from "../../app/pages/admin/board/[id].vue"

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
  it("updates the selected menu on client navigation", async () => {
    mocks.auth.isLoggedIn = true
    mocks.auth.isAdmin = true
    const wrapper = await mountSuspended(AdminIndex, { route: "/admin" })
    const router = useRouter()
    for (const [path, menu] of [["/admin/members", "User"], ["/admin/boards", "Board"], ["/admin", "Dashboard"]]) {
      await router.push(path!)
      await nextTick()
      expect(mocks.openMenu).toHaveBeenLastCalledWith(menu)
    }
    wrapper.unmount()
  })

  it("leaves admin without selecting its dashboard while the home page loads", async () => {
    mocks.auth.isLoggedIn = true
    mocks.auth.isAdmin = true
    const router = useRouter()
    let finishHome!: () => void
    const originalHome = router.getRoutes().find((route) => route.name === "index")!
    const removeHome = router.addRoute({
      path: "/", name: "index",
      component: defineComponent({ async setup() {
        await new Promise<void>((resolve) => { finishHome = resolve })
        return () => h("div", { "data-site-home": "" }, "Site home")
      } }),
    })
    const wrapper = await mountSuspended(NuxtPage, { route: "/admin/members" })
    await vi.waitFor(() => expect(wrapper.find("[data-admin-panel]").exists()).toBe(true))
    mocks.openMenu.mockClear()
    await router.push("/")
    await nextTick()
    expect(router.currentRoute.value.path).toBe("/")
    expect(mocks.openMenu).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(finishHome).toBeTypeOf("function"))
    finishHome()
    await vi.waitFor(() => expect(wrapper.find("[data-site-home]").exists()).toBe(true))
    expect(wrapper.find("[data-admin-panel]").exists()).toBe(false)
    wrapper.unmount()
    removeHome()
    router.addRoute(originalHome)
  })

  it.each([AdminIndex, AdminSection, AdminBoard])("renders the admin panel through each page entry", async (page) => {
    mocks.auth.isLoggedIn = true
    mocks.auth.isAdmin = true
    const wrapper = await mountSuspended(page, { route: "/admin" })
    await nextTick()
    expect(wrapper.find("[data-admin-panel]").exists()).toBe(true)
    wrapper.unmount()
  })

})
