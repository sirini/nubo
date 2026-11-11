import { describe, expect, it } from "vitest"
import { formatLogTimestamp, kstDateKey } from "../../app/utils/securityLogTime"

describe("KST security log dates", () => {
  it("formats fixed-width Korean time without ISO suffixes or locale dependence", () => {
    expect(formatLogTimestamp("2026-01-02T00:04:05.123456Z")).toBe("2026-01-02 09:04:05")
    expect(formatLogTimestamp("2026-01-02T15:00:00Z")).toBe("2026-01-03 00:00:00")
    expect(formatLogTimestamp("2026-01-02T00:04:05+09:00")).toBe("2026-01-02 00:04:05")
    expect(formatLogTimestamp("invalid")).toBe("—")
  })
  it("uses KST calendar days and years at UTC boundaries", () => {
    expect(kstDateKey(new Date("2026-12-31T14:59:59Z"))).toBe("2026-12-31")
    expect(kstDateKey(new Date("2026-12-31T15:00:00Z"))).toBe("2027-01-01")
  })
})
