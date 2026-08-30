import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("board studio Web contract", () => {
  it("uses the protected same-path proxy without accepting a user identity", () => {
    const route = readFileSync("server/api/board/my/studio.get.ts", "utf8")

    expect(route).toContain("safeProxyRequest")
    expect(route).toContain("/board/my/studio")
    expect(route).toContain("Resp<BoardStudioResult>")
    expect(route).not.toContain("userUid")
    expect(route).not.toContain("targetUser")
  })

  it("publishes only the agreed summary, paging, and post DTO fields", () => {
    const types = readFileSync("app/types/board.ts", "utf8")

    for (const field of [
      "postCount",
      "photoCount",
      "viewCount",
      "likeCount",
      "commentCount",
      "totalCount",
      "hasNext",
      "imageCount",
      "submitted",
      "modified",
    ]) {
      expect(types).toContain(`${field}:`)
    }
    expect(types).toContain('"recent" | "views" | "likes" | "comments"')
  })
})
