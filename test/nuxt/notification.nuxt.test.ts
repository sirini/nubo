import { createPinia, setActivePinia } from "pinia"
import { registerEndpoint } from "@nuxt/test-utils/runtime"
import { beforeEach, describe, expect, it } from "vitest"
import { useHomeStore } from "~/stores/home"
import {
  NOTI_CHAT_MESSAGE,
  NOTI_LEAVE_COMMENT,
  NOTI_LIKE_COMMENT,
  NOTI_LIKE_POST,
  NOTI_REPLY_COMMENT,
  type NotificationItem,
} from "~/types/home"
import {
  getNotificationPresentation,
  getNotificationTarget,
} from "~/utils/notification"

const notification = (overrides: Partial<NotificationItem> = {}): NotificationItem => ({
  uid: 11,
  fromUser: { uid: 7, name: "사진가", profile: "" },
  type: NOTI_LIKE_POST,
  id: "photo",
  boardType: 0,
  postUid: 7522,
  checked: false,
  timestamp: 1_000,
  ...overrides,
})

describe("web notification contract", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it.each([
    [NOTI_LIKE_POST, "내 게시글을 좋아합니다"],
    [NOTI_LIKE_COMMENT, "내 댓글을 좋아합니다"],
    [NOTI_LEAVE_COMMENT, "내 게시글에 댓글을 남겼습니다"],
    [NOTI_REPLY_COMMENT, "내 댓글에 답글을 남겼습니다"],
    [NOTI_CHAT_MESSAGE, "나에게 1:1 메시지를 보냈습니다"],
  ])("presents notification type %s as an understandable action", (type, action) => {
    expect(getNotificationPresentation(type).action).toBe(action)
  })

  it("opens post activity at the post or its comment section", () => {
    expect(getNotificationTarget(notification())).toBe("/board/photo/7522")
    expect(getNotificationTarget(notification({ type: NOTI_LEAVE_COMMENT }))).toBe(
      "/board/photo/7522#comments",
    )
  })

  it("opens a message sender's conversation so the recipient can reply", () => {
    expect(getNotificationTarget(notification({ type: NOTI_CHAT_MESSAGE, postUid: 0 }))).toBe(
      "/user/7?tab=conversation#conversation",
    )
  })

  it("does not invent a destination when the notification target is gone", () => {
    expect(getNotificationTarget(notification({ id: "", postUid: 0 }))).toBeNull()
  })

  it("persists a single notification's optimistic read state", async () => {
    const unregister = registerEndpoint("/api/home/noti/checked/11", {
      method: "PATCH",
      handler: () => ({ success: true, error: "", code: 0, result: null }),
    })
    const home = useHomeStore()
    home.notifications = [notification()]

    await expect(home.markNotiRead(11)).resolves.toBe(true)

    expect(home.notifications[0]?.checked).toBe(true)
    unregister()
  })

  it("rolls an optimistic read state back when the server rejects it", async () => {
    const unregister = registerEndpoint("/api/home/noti/checked/13", {
      method: "PATCH",
      handler: () => ({ success: false, error: "Failed", code: 4, result: null }),
    })
    const home = useHomeStore()
    home.notifications = [notification({ uid: 13 })]

    await expect(home.markNotiRead(13)).resolves.toBe(false)

    expect(home.notifications[0]?.checked).toBe(false)
    unregister()
  })

  it("marks every visible notification through the all-read endpoint", async () => {
    const unregister = registerEndpoint("/api/home/noti/checked", {
      method: "PATCH",
      handler: () => ({ success: true, error: "", code: 0, result: null }),
    })
    const home = useHomeStore()
    home.notifications = [
      notification(),
      notification({ uid: 12, type: NOTI_CHAT_MESSAGE }),
    ]

    await expect(home.markAllNotiRead()).resolves.toBe(true)

    expect(home.notifications.every((item) => item.checked)).toBe(true)
    unregister()
  })
})
