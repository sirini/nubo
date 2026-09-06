import { createPinia, setActivePinia } from "pinia"
import { registerEndpoint } from "@nuxt/test-utils/runtime"
import { readBody } from "h3"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "~/stores/auth"
import { useChatStore } from "~/stores/chat"

describe("web direct message contract", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().user.uid = 1
  })

  it("preserves readAt and marks the latest visible incoming message", async () => {
    const readRequests: unknown[] = []
    const unregisterHistory = registerEndpoint("/api/chat/history", {
      method: "GET",
      handler: () => ({
        success: true,
        error: "",
        code: 0,
        result: [
          { uid: 10, userUid: 1, message: "보낸 메시지", timestamp: 1_000, readAt: 3_000 },
          { uid: 11, userUid: 2, message: "받은 메시지", timestamp: 2_000, readAt: 0 },
        ],
      }),
    })
    const unregisterRead = registerEndpoint("/api/chat/read", {
      method: "PATCH",
      handler: async (event) => {
        readRequests.push(await readBody(event))
        return {
          success: true,
          error: "",
          code: 0,
          result: { throughUid: 11, readAt: 4_000, updatedCount: 1 },
        }
      },
    })
    const store = useChatStore()
    store.setConversationVisible(true)

    await store.getChatHistory(2, { silent: true })

    expect(store.history[0]?.readAt).toBe(3_000)
    expect(readRequests).toEqual([{ targetUserUid: 2, throughUid: 11 }])
    unregisterHistory()
    unregisterRead()
  })

  it("does not mark messages read while the conversation is hidden", async () => {
    const readHandler = vi.fn()
    const unregisterHistory = registerEndpoint("/api/chat/history", {
      method: "GET",
      handler: () => ({
        success: true,
        error: "",
        code: 0,
        result: [{ uid: 21, userUid: 2, message: "아직 안 봄", timestamp: 2_000, readAt: 0 }],
      }),
    })
    const unregisterRead = registerEndpoint("/api/chat/read", {
      method: "PATCH",
      handler: readHandler,
    })
    const store = useChatStore()
    store.setConversationVisible(false)

    await store.getChatHistory(2, { silent: true })

    expect(readHandler).not.toHaveBeenCalled()
    unregisterHistory()
    unregisterRead()
  })
})
