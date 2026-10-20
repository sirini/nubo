import { mountSuspended } from "@nuxt/test-utils/runtime"
import { afterEach, describe, expect, it, vi } from "vitest"
import { computed, defineComponent, h, nextTick, provide } from "vue"
import NuboTiptapEditor from "../../app/components/editor/NuboTiptapEditor.vue"
import { nuboEditorKey } from "../../app/providers/contexts/editor"
import { nuboWriteKey, type NuboWriteContext } from "../../app/providers/contexts/write"
import { useEditorProvider } from "../../app/providers/editor"
import { BOARD_CONFIG } from "../../app/types/board"

const EditorWithProviders = defineComponent({
  setup() {
    provide(nuboEditorKey, useEditorProvider())
    provide(nuboWriteKey, {
      isLoggedIn: computed(() => true),
      changeSelectedImages: () => {},
    } as unknown as NuboWriteContext)
    return () => h(NuboTiptapEditor, { modelValue: "<p>Text</p>", config: BOARD_CONFIG })
  },
})

describe("post editor image URL", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("inserts the URL typed in the image dialog", async () => {
    const wrapper = await mountSuspended(EditorWithProviders, { attachTo: document.body })
    await wrapper.get('[aria-label="이미지 삽입"]').trigger("click")
    await nextTick()

    const linkTab = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]')).find(
      (element) => element.textContent?.trim() === "URL 추가",
    )
    expect(linkTab).toBeDefined()
    linkTab?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, ctrlKey: false }))
    await nextTick()
    expect(linkTab?.getAttribute("data-state")).toBe("active")

    await vi.waitFor(() =>
      expect(document.querySelector('input[placeholder="https://example.com/path/image.jpg"]')).not.toBeNull(),
    )
    const input = document.querySelector<HTMLInputElement>('input[placeholder="https://example.com/path/image.jpg"]')
    expect(input).not.toBeNull()
    input!.value = "https://example.com/photo.jpg"
    input!.dispatchEvent(new Event("input", { bubbles: true }))
    await nextTick()

    const addButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
      (element) => element.textContent?.trim() === "추가",
    )
    expect(addButton).toBeDefined()
    addButton?.click()
    await nextTick()

    expect(wrapper.find(".ProseMirror").html()).toContain('src="https://example.com/photo.jpg"')
    wrapper.unmount()
  })
})
