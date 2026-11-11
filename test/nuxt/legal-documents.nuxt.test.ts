import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime"
import { clearNuxtData, useRuntimeConfig } from "#imports"
import { describe, expect, it } from "vitest"
import LegalDocument from "../../app/components/legal/LegalDocument.vue"
import PrivacyOperations from "../../app/components/legal/PrivacyOperations.vue"
import LegalFooter from "../../app/components/legal/LegalFooter.vue"

const operationalState = { visitLogRetentionDays: 0, visitLogEnabled: true, visitLogManualDeletionOnly: true, auditLogRetentionDays: 0, auditLogEnabled: true, auditLogManualDeletionOnly: true, available: true, providers: [] as string[], imageDescriptionEnabled: false, securityLogEnabled: true, securityLogRetentionDays: 7, securityLogMaskedIP: true }
registerEndpoint("/api/legal/status", () => operationalState)

describe("public legal documents", () => {
  it("distinguishes disabled AI from an unconfirmed backend and configured thumbnail search", async () => {
    const original = { ...operationalState }
    let wrapper
    try {
      clearNuxtData("legal-operational-status")
      wrapper = await mountSuspended(PrivacyOperations, { route: "/privacy" })
      expect(wrapper.text()).toContain("설정된 외부 위탁·연동은 없습니다")
      expect(wrapper.text()).toContain("현재 사용하지 않습니다")
      expect(wrapper.text()).toContain("페이지 경로와 접속 IP 원문")
      expect(wrapper.text()).toContain("접근을 제한해 계속 보관")
      expect(wrapper.text()).toContain("기록 삭제 기능을 제공하지 않습니다")
      wrapper.unmount()
      operationalState.available = false
      clearNuxtData("legal-operational-status")
      wrapper = await mountSuspended(PrivacyOperations, { route: "/privacy" })
      expect(wrapper.text()).toContain("외부 처리 없음으로 판단하지 않으며")
      expect(wrapper.text()).not.toContain("설정된 외부 위탁·연동은 없습니다")
      wrapper.unmount()
      Object.assign(operationalState, { available: true, providers: ["OpenAI"], imageDescriptionEnabled: true })
      clearNuxtData("legal-operational-status")
      wrapper = await mountSuspended(PrivacyOperations, { route: "/privacy" })
      expect(wrapper.text()).toContain("작은 썸네일")
      expect(wrapper.text()).toContain("텍스트 검색")
    } finally {
      wrapper?.unmount()
      Object.assign(operationalState, original)
      clearNuxtData("legal-operational-status")
    }
  })

  it.each(["2026-11-09", "2026-11-10", "2026-11-11"])("keeps %s privacy policy without today's live operational statements", async (version) => {
    const wrapper = await mountSuspended(LegalDocument, { props: { kind: "privacy" }, route: `/privacy?version=${version}` })
    expect(wrapper.get('[role="status"]').text()).toContain("이전 문서")
    expect(wrapper.get("time").text()).toBe(version)
    expect(wrapper.find("#privacy-operations").exists()).toBe(false)
    wrapper.unmount()
  })

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
