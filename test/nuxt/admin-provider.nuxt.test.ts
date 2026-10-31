import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime"
import { describe, expect, it, vi } from "vitest"
import { defineComponent, h, reactive, ref } from "vue"
import { useAdminProvider } from "../../app/providers/admin"

const mocks = vi.hoisted(() => ({ close: vi.fn() }))
mockNuxtImport("useAdminStore", () => () => ({ closeAddGroupDialog: mocks.close }))
mockNuxtImport("useAuthStore", () => () => ({}))
mockNuxtImport("useSkins", () => () => ({ settings: { value: { admin: "nubo-basic-admin" } } }))

describe("admin provider actions", () => {
  it("keeps overlapping pages on their own menu and panel", async () => {
    const outgoingMenu = ref<"Board" | "User">("Board")
    const incomingMenu = ref<"Board" | "User">("User")
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        const outgoing = useAdminProvider(outgoingMenu)
        const incoming = useAdminProvider(incomingMenu)
        const outgoingPanel = outgoing.panel.value
        expect(outgoing.menu.value).toBe("Board")
        expect(incoming.menu.value).toBe("User")
        expect(incoming.panel.value).not.toBe(outgoingPanel)
        incomingMenu.value = "Board"
        expect(outgoing.panel.value).toBe(outgoingPanel)
        expect(outgoing.menu.value).toBe("Board")
        return () => h("div")
      },
    }))
    wrapper.unmount()
  })

  it("closes the group dialog when its cancel action is clicked", async () => {
    const state = reactive({ open: true })
    mocks.close.mockImplementation(() => { state.open = false })
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        const admin = useAdminProvider()
        return () => state.open ? h("button", { onClick: admin.closeAddGroupDialog }, "취소") : h("p", "닫힘")
      },
    }))
    await wrapper.get("button").trigger("click")
    expect(mocks.close).toHaveBeenCalledOnce()
    expect(wrapper.text()).toBe("닫힘")
    wrapper.unmount()
  })
})
