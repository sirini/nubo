import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("Market user contract", () => {
  it("only exposes the stable user identity needed by Market", () => {
    const route = readFileSync("server/api/market/user.get.ts", "utf8")

    expect(route).toContain('Pick<UserMyResult, "uid" | "name" | "admin">')
    expect(route).toContain("const { uid, name, admin } = response.result")
    expect(route).not.toContain("response.result.token")
    expect(route).not.toContain("response.result.refresh")
    expect(route).not.toContain("response.result.id")
  })
})
