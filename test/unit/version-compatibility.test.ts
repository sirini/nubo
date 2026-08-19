import { describe, expect, it } from "vitest"
import { parseReleaseManifest } from "../../server/utils/releaseManifest"
import { versionIssues } from "../../server/utils/versionCompatibility"

const manifest = {
  releaseVersion: "1.2.11",
  apiContract: "1",
  components: {
    nubo: { version: "1.2.11", commit: "nubo-commit", dirty: false },
    goapi: { version: "1.2.11", commit: "goapi-commit", dirty: false },
  },
}

const goapi = { status: "ok", service: "goapi", version: "1.2.11", apiContract: "1" }

describe("release version compatibility", () => {
  it("parses the public build identity from a release manifest", () => {
    expect(parseReleaseManifest(manifest)).toEqual(manifest)
    expect(parseReleaseManifest({ releaseVersion: "1.2.11", components: {} })).toBeNull()
  })

  it("accepts a matching release and runtime", () => {
    expect(versionIssues("1.2.11", goapi, manifest)).toEqual([])
  })

  it("reports manifest, component version, and API contract mismatches", () => {
    expect(versionIssues("1.2.12", { ...goapi, version: "1.2.10", apiContract: "2" }, manifest)).toEqual([
      "nubo_version_mismatch",
      "goapi_version_mismatch",
      "api_contract_mismatch",
    ])
    expect(versionIssues("1.2.11", null, null)).toEqual([
      "release_manifest_unavailable",
      "goapi_unavailable",
    ])
  })
})
