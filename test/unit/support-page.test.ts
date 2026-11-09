import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

describe("public support page", () => {
  it("provides contact and account safety routes required by app distribution", () => {
    const support = source("app/pages/support.vue")

    expect(support).toContain("mailto:")
    expect(support).toContain("config.public.adminId")
    expect(support).toContain('to="/terms"')
    expect(support).toContain('to="/privacy"')
    expect(support).toContain('to="/delete-account"')
    expect(support).toContain("비밀번호, 인증 코드")
  })

  it("links support from the shared public navigation", () => {
    const menu = source("app/skins/nubo-basic-layout/components/LayoutTopMenu.vue")

    expect(menu).toContain('to="/support"')
    expect(menu).toContain("고객 지원")
  })

})
