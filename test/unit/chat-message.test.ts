import { describe, expect, it } from "vitest"
import type { ChatHistory } from "../../app/types/chat"
import {
  hashtagSearchPath,
  latestOutgoingMessageUid,
  splitChatMessage,
} from "../../app/utils/chat"

const chat = (uid: number, userUid: number, readAt = 0): ChatHistory => ({
  uid,
  userUid,
  message: `메시지 ${uid}`,
  timestamp: 1_000,
  readAt,
})

describe("direct message presentation", () => {
  it("links Unicode hashtags while preserving surrounding text", () => {
    expect(splitChatMessage("오늘 #여름사진 그리고 #film_2026 같이 봐요")).toEqual([
      { type: "text", value: "오늘 " },
      { type: "hashtag", value: "여름사진" },
      { type: "text", value: " 그리고 " },
      { type: "hashtag", value: "film_2026" },
      { type: "text", value: " 같이 봐요" },
    ])
  })

  it("does not treat a hash attached to a word as a hashtag", () => {
    expect(splitChatMessage("C# 문법과 사진#설명")).toEqual([
      { type: "text", value: "C# 문법과 사진#설명" },
    ])
  })

  it("routes hashtags to the existing tag search and labels only the latest sent message", () => {
    expect(hashtagSearchPath("여름 사진")).toBe("/search/tag/%EC%97%AC%EB%A6%84%20%EC%82%AC%EC%A7%84")
    expect(latestOutgoingMessageUid([chat(10, 1, 1000), chat(11, 2), chat(12, 1)], 1)).toBe(12)
  })
})
