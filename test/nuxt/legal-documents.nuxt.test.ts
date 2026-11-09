import { mountSuspended } from "@nuxt/test-utils/runtime"
import { useRuntimeConfig } from "#imports"
import { describe, expect, it } from "vitest"
import LegalDocument from "../../app/components/legal/LegalDocument.vue"
import LegalFooter from "../../app/components/legal/LegalFooter.vue"

describe("public legal documents", () => {
  it("exposes all three documents in the footer", async () => {
    const wrapper = await mountSuspended(LegalFooter)
    expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual(["/terms", "/privacy", "/disclaimer"])
    expect(wrapper.find('a[href="/privacy"]').text()).toBe("개인정보처리방침")
    wrapper.unmount()
  })

  it("renders deployment contact details as text and offers privacy rights and history", async () => {
    const config = useRuntimeConfig()
    const original = { ...config.public }
    Object.assign(config.public, {
      legalOperator: "사진 모임 운영팀", legalOfficer: "개인정보 담당팀", legalEmail: "privacy@example.org",
      legalProcessingDetails: "접속 기록: 7일\n<script>alert(1)</script>",
    })
    try {
      const wrapper = await mountSuspended(LegalDocument, { props: { kind: "privacy" }, route: "/privacy" })
      expect(wrapper.text()).toContain("사진 모임 운영팀")
      expect(wrapper.text()).toContain("개인정보 담당팀")
      expect(wrapper.find('a[href="mailto:privacy@example.org"]').exists()).toBe(true)
      expect(wrapper.text()).toContain("접속 기록: 7일")
      expect(wrapper.find("script").exists()).toBe(false)
      expect(wrapper.text()).toContain("EXIF")
      expect(wrapper.find('a[href="/delete-account"]').exists()).toBe(true)
      expect(wrapper.find('a[href="/privacy?version=2026-09-06"]').exists()).toBe(true)
      wrapper.unmount()
    } finally {
      Object.assign(config.public, original)
    }
  })

  it("serves the previous privacy text separately from the current version", async () => {
    const wrapper = await mountSuspended(LegalDocument, { props: { kind: "privacy" }, route: "/privacy?version=2026-09-06" })
    expect(wrapper.get('[role="status"]').text()).toContain("이전 문서")
    expect(wrapper.text()).toContain("SENSTA 모바일 앱")
    expect(wrapper.text()).toContain("2026년 9월 6일")
    expect(wrapper.find("#legal-section-17").exists()).toBe(false)
    wrapper.unmount()
  })
})
