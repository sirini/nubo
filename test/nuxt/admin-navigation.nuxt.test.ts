import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime"
import { describe, expect, it, vi } from "vitest"
import { defineComponent, h } from "vue"
import { NuxtLayout, NuxtPage } from "#components"
import { useRouter } from "#imports"
import { RouterLink } from "vue-router"
import { BOARD_LIST_RESULT, BOARD_CONFIG } from "../../app/types/board"

// Keep the real admin skin, including its nested async panel and form loaders.
vi.mock("../../app/skins/nubo-basic-admin/Admin.vue", async (importOriginal) => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return importOriginal()
})

const mocks = vi.hoisted(() => ({ boardConfig: vi.fn(), boardList: vi.fn(), userList: vi.fn(async () => ({ success: true, result: { item: [], total: 0 } })) }))
mockNuxtImport("useAuthStore", () => () => ({
  isLoggedIn: true, isAdmin: true, user: { uid: 1, name: "Admin", profile: "" },
}))
mockNuxtImport("useColorMode", () => () => ({ preference: "light", value: "light" }))
mockNuxtImport("useHome", () => () => ({
  addVisitHistory: () => {},
  loadInitPosts: async () => ({ success: true, result: [] }),
  loadInitPostsById: async (id: string) => ({ success: true, result: { items: [], config: { ...BOARD_CONFIG, id } } }),
  loadInitHomeMenus: async () => ({ success: true, result: [] }),
  loadMyNotifications: async () => ({ success: true, result: [] }),
}))
registerEndpoint("/api/skin/settings", () => ({ success: true, result: {} }))
registerEndpoint("/api/auth/user/achievements", () => ({ success: true, result: [] }))

mockNuxtImport("useBoard", () => () => ({ loadInitBoardList: mocks.boardList }))
mockNuxtImport("useAdmin", () => () => new Proxy({
  loadBoardConfig: mocks.boardConfig,
  loadGroupList: async () => ({ success: true, result: [] }),
  loadUserList: mocks.userList,
}, { get: (target, name) => target[name as keyof typeof target] ?? (async () => ({ success: false, error: "unused test endpoint", result: null })) }))

describe("admin navigation with real asynchronous skins", () => {
  it("opens board settings, switches menus and leaves for the public home repeatedly", async () => {
    mocks.boardList.mockResolvedValue({ success: true, result: {
      ...BOARD_LIST_RESULT, isAdmin: true, config: { ...BOARD_CONFIG, id: "news", name: "News" },
    } })
    mocks.boardConfig.mockImplementation(async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      return { success: true, result: { config: { ...BOARD_CONFIG, id, name: `Board ${id}` }, groups: [] } }
    })
    const router = useRouter()
    const renderErrors = vi.fn()
    const app = defineComponent({ setup: () => () => h(NuxtLayout, null, { default: () => h(NuxtPage) }) })
    const wrapper = await mountSuspended(app, {
      route: "/board/news/page/1",
      // Chart rendering needs browser SVG APIs; keep routing, layout and all panels real.
      global: { components: { RouterLink }, stubs: { DashboardGraph: true }, config: { errorHandler: renderErrors } },
    })
    try {
      for (let visit = 0; visit < 2; visit++) {
        await router.push("/board/news/page/1")
        await vi.waitFor(() => expect(wrapper.find('a[href="/admin/board/news"]').exists()).toBe(true))
        await wrapper.get('a[href="/admin/board/news"]').trigger("click")
        await vi.waitFor(() => expect(wrapper.find('input#id').exists()).toBe(true))
        expect(wrapper.get('input#id').element).toHaveProperty("value", "news")
        if (visit === 0) {
          await router.push("/admin/board/photos")
          await vi.waitFor(() => expect(wrapper.get("input#id").element).toHaveProperty("value", "photos"))
          router.back()
          await vi.waitFor(() => expect(router.currentRoute.value.path).toBe("/admin/board/news"))
          await vi.waitFor(() => expect(wrapper.get("input#id").element).toHaveProperty("value", "news"))
        }
        mocks.userList.mockClear()
        const members = wrapper.findAll('a[href="/admin/members"]').at(0)!
        await members.trigger("click")
        await vi.waitFor(() => expect(wrapper.findAll("h2").some((heading) => heading.text() === "사용자 관리")).toBe(true))
        expect(mocks.userList).toHaveBeenCalledTimes(1)
        if (visit === 0) {
          const destinations = [
            ["/admin/boards", "그룹 관리"],
            ["/admin/badges", "업적 배지"],
            ["/admin/reports", "미해결된 신고들"],
            ["/admin/mail", "단체 메일"],
            ["/admin/skins", "스킨 관리"],
            ["/admin", "이메일 발송 알아두기"],
            ["/admin/members", "사용자 관리"],
          ] as const
          for (const [path, heading] of destinations) {
            await wrapper.findAll(`a[href="${path}"]`).at(0)!.trigger("click")
            await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(path))
            await vi.waitFor(() => expect(wrapper.findAll("h1,h2,h3").map((node) => node.text()), path).toContain(heading))
          }
          router.back()
          await vi.waitFor(() => expect(router.currentRoute.value.path).toBe("/admin"))
          await vi.waitFor(() => expect(wrapper.findAll("h2").some((node) => node.text() === "이메일 발송 알아두기")).toBe(true))
          router.forward()
          await vi.waitFor(() => expect(router.currentRoute.value.path).toBe("/admin/members"))
          await vi.waitFor(() => expect(wrapper.findAll("h2").some((node) => node.text() === "사용자 관리")).toBe(true))
        }
        await wrapper.findAll('a[href="/"]').at(0)!.trigger("click")
        await vi.waitFor(() => expect(wrapper.find("h1").text()).toBe("빌더들의 이야기"))
        expect(wrapper.find('a[href="/admin/members"]').exists()).toBe(false)
      }
      expect(renderErrors).not.toHaveBeenCalled()
    } finally {
      wrapper.unmount()
    }
  }, 15000)

  it("can leave settings while its asynchronous form is still loading", async () => {
    const router = useRouter()
    let resolveConfig!: (value: unknown) => void
    mocks.boardConfig.mockImplementation(() => new Promise((resolve) => { resolveConfig = resolve }))
    const wrapper = await mountSuspended(NuxtPage, { route: "/admin/members", global: { components: { RouterLink } } })
    try {
      await vi.waitFor(() => expect(wrapper.findAll("h2").some((heading) => heading.text() === "사용자 관리")).toBe(true))
      await router.push("/admin/board/news")
      await vi.waitFor(() => expect(resolveConfig).toBeTypeOf("function"))
      await router.push("/admin/members")
      resolveConfig({ success: true, result: { config: { ...BOARD_CONFIG, id: "news", name: "News" }, groups: [] } })
      await vi.waitFor(() => expect(wrapper.findAll("h2").some((heading) => heading.text() === "사용자 관리")).toBe(true))
      expect(wrapper.find("input#id").exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })
})
