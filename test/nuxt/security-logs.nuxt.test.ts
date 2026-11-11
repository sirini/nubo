import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime"
import { getQuery, setHeader } from "h3"
import { describe, expect, it, vi } from "vitest"
import SecurityLogs from "../../app/skins/nubo-basic-admin/Logs.vue"

const requests: Record<string, unknown>[] = []
registerEndpoint("/api/admin/system/visits", () => ({ items: [], next: 0, retentionDays: 90, fullIP: true }))
registerEndpoint("/api/admin/system/visit-statistics", () => ({ counts: { "2026-11": 12 }, retentionDays: 90 }))
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
})
