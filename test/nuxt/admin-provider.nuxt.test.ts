import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime"
import { describe, expect, it, vi } from "vitest"
import { defineComponent, h, reactive } from "vue"
import { useAdminProvider } from "../../app/providers/admin"

const mocks = vi.hoisted(() => ({ close: vi.fn() }))
mockNuxtImport("useAdminStore", () => () => ({ closeAddGroupDialog: mocks.close }))
mockNuxtImport("useAuthStore", () => () => ({}))
mockNuxtImport("useSkins", () => () => ({ settings: { value: { admin: "nubo-basic-admin" } } }))

describe("admin provider actions", () => {
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
