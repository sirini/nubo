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

  it("documents mobile collection, processors, deletion, and no ad tracking", () => {
    const privacy = source("app/skins/nubo-basic-privacy/Privacy.vue")

    expect(privacy).toContain("SENSTA 모바일 앱")
    expect(privacy).toContain("Google Firebase")
    expect(privacy).toContain("GPS 위치 메타데이터를 제거")
    expect(privacy).toContain("맞춤형 광고 추적에 사용하지 않습니다")
    expect(privacy).toContain('to="/delete-account"')
  })
})
