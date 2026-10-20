import { mountSuspended } from "@nuxt/test-utils/runtime"
import type { Editor } from "@tiptap/vue-3"
import { afterEach, describe, expect, it } from "vitest"
import { nextTick, ref, shallowRef } from "vue"
import NuboTiptapEditor from "../../app/components/editor/NuboTiptapEditor.vue"
import { nuboEditorKey, type NuboEditorContext } from "../../app/providers/contexts/editor"
import { BOARD_CONFIG } from "../../app/types/board"

describe("post editor heading selector", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("applies H1 through H4 and returns to a paragraph", async () => {
    const editor = shallowRef<Editor | null>(null)
    const headingStyle = ref("0")
    const context = {
      headingStyle,
      isUploading: ref(false),
      isBold: ref(false),
      isItalic: ref(false),
      isStrike: ref(false),
      isBlockquote: ref(false),
      isCode: ref(false),
      isCodeBlock: ref(false),
      isAddLinkDialog: ref(false),
      isImageUploadDialog: ref(false),
      bindEditor: (value: Editor | null) => { editor.value = value },
      setHeadingStyle: (value: string) => {
        if (value === "0") editor.value?.chain().focus().setParagraph().run()
        else editor.value?.chain().focus().setHeading({ level: Number(value) as 1 | 2 | 3 | 4 }).run()
      },
      getAttr: () => ({}),
    } as unknown as NuboEditorContext

    const wrapper = await mountSuspended(NuboTiptapEditor, {
      props: { modelValue: "<p>Heading text</p>", config: BOARD_CONFIG },
      global: {
        provide: { [nuboEditorKey as symbol]: context },
        stubs: {
          NuboEditorImageDialog: true,
          NuboEditorLinkDialog: true,
          NuboEditorTableMenu: true,
        },
      },
      attachTo: document.body,
    })

    for (const level of [1, 2, 3, 4]) {
      await wrapper.get('[aria-label="문단 스타일"]').trigger("pointerdown", { button: 0 })
      await nextTick()
      const item = Array.from(document.querySelectorAll('[role="option"]')).find(
        (element) => element.textContent?.trim() === `H${level}`,
      ) as HTMLElement | undefined
      expect(item).toBeDefined()
      item?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "mouse" }))
      await nextTick()
      expect(editor.value?.getHTML()).toBe(`<h${level}>Heading text</h${level}>`)
    }

    await wrapper.get('[aria-label="문단 스타일"]').trigger("pointerdown", { button: 0 })
    const paragraph = Array.from(document.querySelectorAll('[role="option"]')).find(
      (element) => element.textContent?.trim() === "본문",
    ) as HTMLElement | undefined
    paragraph?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "mouse" }))
    await nextTick()
    expect(editor.value?.getHTML()).toBe("<p>Heading text</p>")
    wrapper.unmount()
  })
})
