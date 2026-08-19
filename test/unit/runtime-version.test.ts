import { describe, expect, it } from "vitest"
import { versionCompatibilityMessages } from "../../app/utils/runtimeVersion"

describe("admin runtime version warning", () => {
  it("shows only actionable version and contract mismatches", () => {
    expect(versionCompatibilityMessages([
      "release_manifest_unavailable",
      "nubo_version_mismatch",
      "goapi_unavailable",
      "api_contract_mismatch",
    ])).toEqual([
      "실행 중인 NUBO Web 버전이 릴리스 manifest와 다릅니다.",
      "NUBO Web과 GOAPI의 API contract가 일치하지 않습니다.",
    ])
  })

  it("does not warn for a compatible runtime", () => {
    expect(versionCompatibilityMessages([])).toEqual([])
  })
})
