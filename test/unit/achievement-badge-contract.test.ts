import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

describe("achievement badge contract", () => {
  it("keeps achievements distinct from current admin status", () => {
    const types = read("app/types/user.ts")

    expect(types).toContain("export type UserBadge")
    expect(types).toContain("badges: UserBadge[]")
    expect(types).toContain("admin: boolean")
  })

  it("uses the server description for an accessible inline tooltip", () => {
    const inline = read("app/components/user/UserInlineBadges.vue")

    expect(inline).toContain(':content="badge.description"')
    expect(inline).toContain(':aria-label="`${badge.name}: ${badge.description}`"')
    expect(inline).toContain('tabindex="0"')
  })

  it("renders all profile achievements and only API-provided inline badges", () => {
    const shelf = read("app/components/user/UserAchievementShelf.vue")
    const inline = read("app/components/user/UserInlineBadges.vue")

    expect(shelf).toContain('v-for="badge in badges"')
    expect(inline).toContain('v-for="badge in badges"')
    expect(inline).not.toContain("sensta-app")
  })
})
