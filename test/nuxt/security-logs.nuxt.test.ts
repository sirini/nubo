import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime"
import { getQuery, readBody, setHeader, setResponseStatus } from "h3"
import { describe, expect, it, vi } from "vitest"
import SecurityLogs from "../../app/skins/nubo-basic-admin/Logs.vue"

registerEndpoint("/api/legal/status", () => ({ available: true, visitLogManualDeletionOnly: true, auditLogManualDeletionOnly: true }))

const requests: Record<string, unknown>[] = []
const deletions: unknown[] = []
registerEndpoint("/api/admin/system/records/visits", { method: "DELETE", handler: async (event) => {
  deletions.push({ query: getQuery(event), body: await readBody(event) })
  return { success: true, deleted: true }
} })
registerEndpoint("/api/admin/system/audit", (event) => { setResponseStatus(event, 400); return { error: "interrupted deletion" } })
registerEndpoint("/api/admin/system/visits", () => ({ items: [], next: 0, retentionDays: 0, manualDeletionOnly: true, fullIP: true }))
registerEndpoint("/api/admin/system/visit-statistics", () => ({ counts: { "2026-11": 12 }, retentionDays: 0, manualDeletionOnly: true }))
registerEndpoint("/api/admin/system/logs", (event) => {
  const query = getQuery(event)
  requests.push(query)
  if (query.format === "csv") {
    setHeader(event, "content-type", "text/csv; charset=utf-8")
    return "time_utc,method\n2026-11-10T00:00:00Z,POST\n"
  }
  return { items: [{ time: "2026-11-10T00:00:00Z", method: "POST", route: "/board/:id", status: 204, durationMs: 2, actor: 1, peer: "192.0.2.0/24" }], next: 0, retentionDays: 7, maskedIP: true, writeError: false, dropped: 0 }
})

describe("security log administration", () => {
  it("shows private metadata and exports the selected UTC day as a CSV blob", async () => {
    const create = vi.fn(() => "blob:security-log-test")
    const revoke = vi.fn()
    const oldCreate = Object.getOwnPropertyDescriptor(URL, "createObjectURL")
    const oldRevoke = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL")
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: create })
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revoke })
    const wrapper = await mountSuspended(SecurityLogs)
    await wrapper.findAll("select")[1]!.setValue("logs")
    try {
      await vi.waitFor(() => expect(wrapper.text()).toContain("192.0.2.0/24"))
      await wrapper.get('input[type="date"]').setValue("2026-11-10")
      await wrapper.findAll("button").find((button) => button.text() === "CSV 내려받기")!.trigger("click")
      await vi.waitFor(() => expect(create).toHaveBeenCalledOnce())
      expect(requests.some((query) => query.date === "2026-11-10" && query.format === "csv")).toBe(true)
      expect(wrapper.text()).toContain("실제 이용자 주소와 다릅니다")
      await vi.waitFor(() => expect(revoke).toHaveBeenCalledOnce(), { timeout: 2000 })
    } finally {
      wrapper.unmount()
      if (oldCreate) Object.defineProperty(URL, "createObjectURL", oldCreate)
      else Reflect.deleteProperty(URL, "createObjectURL")
      if (oldRevoke) Object.defineProperty(URL, "revokeObjectURL", oldRevoke)
      else Reflect.deleteProperty(URL, "revokeObjectURL")
    }
  })
  it("requires an explicit past date and acknowledgement before irreversible deletion", async () => {
    deletions.length = 0
    const wrapper = await mountSuspended(SecurityLogs)
    try {
      await vi.waitFor(() => expect(wrapper.text()).toContain("관리자가 직접 삭제할 때까지 계속 보관"))
      const button = () => wrapper.findAll("button").find((item) => item.text() === "선택한 날짜 기록 영구 삭제")!
      expect(button().attributes("disabled")).toBeDefined()
      await wrapper.get('input[type="date"]').setValue("2020-01-01")
      await wrapper.get('input[placeholder="YYYY-MM-DD"]').setValue("2020-01-02")
      await wrapper.get('input[type="checkbox"]').setValue(true)
      expect(button().attributes("disabled")).toBeDefined()
      expect(deletions).toHaveLength(0)
      await wrapper.get('input[placeholder="YYYY-MM-DD"]').setValue("2020-01-01")
      await vi.waitFor(() => expect(button().attributes("disabled")).toBeUndefined())
      await button().trigger("click")
      await vi.waitFor(() => expect(wrapper.text()).toContain("2020-01-01 (UTC)의 기록을 삭제했습니다."))
      expect(deletions).toEqual([{ query: { date: "2020-01-01" }, body: { confirmDate: "2020-01-01", reason: "retention-policy" } }])
      expect(wrapper.get('input[placeholder="YYYY-MM-DD"]').element).toHaveProperty("value", "")
      await wrapper.get('input[type="date"]').setValue(new Date().toISOString().slice(0, 10))
      await wrapper.get('input[placeholder="YYYY-MM-DD"]').setValue(new Date().toISOString().slice(0, 10))
      await wrapper.get('input[type="checkbox"]').setValue(true)
      expect(button().attributes("disabled")).toBeDefined()
    } finally { wrapper.unmount() }
  })

  it("keeps explicit deletion available when an interrupted past audit day cannot be read", async () => {
    const wrapper = await mountSuspended(SecurityLogs)
    try {
      await wrapper.findAll("select")[1]!.setValue("audit")
      await vi.waitFor(() => expect(wrapper.text()).toContain("로그를 불러오지 못했습니다"))
      await vi.waitFor(() => expect(wrapper.find('input[placeholder="YYYY-MM-DD"]').exists()).toBe(true))
      await wrapper.get('input[type="date"]').setValue("2020-01-01")
      await wrapper.get('input[placeholder="YYYY-MM-DD"]').setValue("2020-01-01")
      await wrapper.findAll('input[type="checkbox"]')[0]!.setValue(true)
      const button = wrapper.findAll("button").find((item) => item.text() === "선택한 날짜 기록 영구 삭제")!
      await vi.waitFor(() => expect(button.attributes("disabled")).toBeUndefined())
    } finally { wrapper.unmount() }
  })

})
