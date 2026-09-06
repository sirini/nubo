import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { scrollChatViewportToBottom } from "../../app/composables/useChatAutoScroll"

describe("direct message auto scroll", () => {
  it("scrolls only the conversation viewport inside its local root", () => {
    const scrollTo = vi.fn()
    const querySelector = vi.fn(() => ({ scrollHeight: 640, scrollTo }))
    const root = { querySelector } as unknown as HTMLElement

    scrollChatViewportToBottom(root)

    expect(querySelector).toHaveBeenCalledWith('[data-slot="scroll-area-viewport"]')
    expect(scrollTo).toHaveBeenCalledWith({ top: 640, behavior: "smooth" })
  })

  it("wires both built-in profile skins to the shared last-message watcher", () => {
    const sources = [
      "app/skins/nubo-basic-profile/components/ProfileChatHistory.vue",
      "app/skins/nubo-advance-profile/components/AdvanceProfileConversation.vue",
    ].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"))

    for (const source of sources) {
      expect(source).toContain('ref="chatAreaRoot"')
      expect(source).toContain("chatHistories.value.at(-1)?.uid")
      expect(source).toContain("useChatAutoScroll(chatAreaRoot, latestMessageUid)")
      expect(source).not.toContain("document.querySelector")
    }
  })

  it("keeps lightweight polling scoped to the visible active conversation", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/composables/useChatConversation.ts"),
      "utf8",
    )

    expect(source).toContain("const CHAT_POLL_INTERVAL = 12_000")
    expect(source).toContain("toValue(visible)")
    expect(source).toContain('documentVisibility.value === "visible"')
    expect(source).toContain("() => chat.refreshChatHistory()")
    expect(source).toContain("pause()")
  })
})
