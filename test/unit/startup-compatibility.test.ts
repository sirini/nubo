import { describe, expect, it, vi } from "vitest"
import { checkStartupContract } from "../../server/utils/startupCompatibility"

const goapiVersion = {
  status: "ok",
  service: "goapi",
  version: "1.2.11",
  apiContract: "1",
}

describe("Nitro startup contract check", () => {
  it("accepts the supported GOAPI contract with a bounded request", async () => {
    const fetchVersion = vi.fn().mockResolvedValue(goapiVersion)

    await expect(checkStartupContract("http://127.0.0.1:3006/goapi", fetchVersion)).resolves.toEqual({
      status: "compatible",
      expected: "1",
      actual: "1",
    })
    expect(fetchVersion).toHaveBeenCalledWith("http://127.0.0.1:3006/goapi/version", {
      retry: 0,
      timeout: 2000,
    })
  })

  it("reports a mismatch without throwing", async () => {
    const fetchVersion = vi.fn().mockResolvedValue({ ...goapiVersion, apiContract: "2" })
    await expect(checkStartupContract("http://goapi", fetchVersion)).resolves.toEqual({
      status: "incompatible",
      expected: "1",
      actual: "2",
    })
  })

  it("keeps startup available when GOAPI is not ready yet", async () => {
    const fetchVersion = vi.fn().mockRejectedValue(new Error("connection refused"))
    await expect(checkStartupContract("http://goapi", fetchVersion)).resolves.toEqual({
      status: "unavailable",
      expected: "1",
    })
  })
})
