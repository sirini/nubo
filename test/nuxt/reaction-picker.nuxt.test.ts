import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime"
import { afterEach, describe, expect, it, vi } from "vitest"
import { nextTick } from "vue"
import ReactionPicker from "../../app/components/reaction/ReactionPicker.vue"
import { REACTION_STATE } from "../../app/types/reaction"

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport("navigateTo", () => navigateToMock)

describe("reaction picker", () => {
  afterEach(() => {
    document.body.innerHTML = ""
    navigateToMock.mockClear()
  })

  it("opens the choices and emits the selected reaction", async () => {
    const wrapper = await mountSuspended(ReactionPicker, {
      props: { state: structuredClone(REACTION_STATE), disabled: false },
      attachTo: document.body,
    })

    await wrapper.get("button.trigger").trigger("click")
    await nextTick()
    expect(document.querySelector('[role="group"][aria-label="리액션 선택"]')).not.toBeNull()
    expect(navigateToMock).not.toHaveBeenCalled()

    const choice = document.querySelector<HTMLButtonElement>('button[aria-label^="최고 선택"]')
    expect(choice).not.toBeNull()
    choice?.click()
    await nextTick()
    expect(wrapper.emitted("select")?.[0]).toEqual(["best"])
    wrapper.unmount()
  })

  it("offers the extended reaction kinds", async () => {
    const wrapper = await mountSuspended(ReactionPicker, {
      props: { state: structuredClone(REACTION_STATE), disabled: false },
      attachTo: document.body,
    })

    await wrapper.get("button.trigger").trigger("click")
    await nextTick()
    for (const label of ["웃겨요", "축하해요", "멋져요", "응원해요", "슬퍼요", "주목해요"]) {
      expect(document.querySelector(`button[aria-label^="${label} 선택"]`)).not.toBeNull()
    }
    const choice = document.querySelector<HTMLButtonElement>('button[aria-label^="웃겨요 선택"]')
    choice?.click()
    await nextTick()
    expect(wrapper.emitted("select")?.[0]).toEqual(["laugh"])
    wrapper.unmount()
  })

  it("shows reaction choices before asking an anonymous visitor to log in", async () => {
    const wrapper = await mountSuspended(ReactionPicker, {
      props: { state: structuredClone(REACTION_STATE), disabled: true },
      attachTo: document.body,
    })

    await wrapper.get("button.trigger").trigger("click")
    await nextTick()
    expect(document.querySelector('[role="group"][aria-label="리액션 선택"]')).not.toBeNull()
    expect(navigateToMock).not.toHaveBeenCalled()

    const choice = document.querySelector<HTMLButtonElement>('button[aria-label^="최고 선택"]')
    expect(choice).not.toBeNull()
    choice?.click()
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalledWith({
      path: "/auth/login",
      query: { redirect: "/" },
    }))
    expect(wrapper.emitted("select")).toBeUndefined()
    wrapper.unmount()
  })
})
