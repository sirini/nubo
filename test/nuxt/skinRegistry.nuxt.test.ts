import { describe, expect, it } from "vitest"
import { useSkins } from "../../app/composables/useSkins"

describe("built-in skin registry", () => {
  it("loads every configured default from a valid manifest", () => {
    const { defaults, installed, manifestIssues } = useSkins()

    expect(manifestIssues.value).toEqual([])
    for (const [type, key] of Object.entries(defaults)) {
      expect(installed.value).toContainEqual(expect.objectContaining({ type, key }))
    }
  })
})
