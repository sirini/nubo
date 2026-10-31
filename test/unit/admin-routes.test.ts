import { describe, expect, it } from "vitest"
import { adminMenuForPath, adminMenuPaths } from "../../app/utils/adminRoutes"

describe("admin routes", () => {
  it("maps every menu to its own address and back", () => {
    expect(new Set(Object.values(adminMenuPaths)).size).toBe(Object.keys(adminMenuPaths).length)
    for (const [menu, path] of Object.entries(adminMenuPaths)) {
      expect(adminMenuForPath(path)).toBe(menu)
    }
  })

  it("does not select an admin panel for public or unknown routes", () => {
    for (const path of ["/", "/board/news/page/1", "/auth/login", "/administrator", "/admin/unknown"]) {
      expect(adminMenuForPath(path)).toBeNull()
    }
  })

  it("keeps existing board edit links in the board menu", () => {
    expect(adminMenuForPath("/admin/board/news")).toBe("Board")
  })
})
