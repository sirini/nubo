import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("original image proxy contract", () => {
  it("keeps authorization on the JSON endpoint and streams the tokenized image", () => {
    const issueRoute = readFileSync("server/api/board/original.get.ts", "utf8")
    const transferRoute = readFileSync("server/api/board/original/transfer.get.ts", "utf8")

    expect(issueRoute).toContain("safeProxyRequest")
    expect(issueRoute).toContain("/board/original")
    expect(transferRoute).toContain("proxyRequest")
    expect(transferRoute).not.toContain("safeProxyRequest")
    expect(transferRoute).toContain("/board/original/transfer")
  })
})
