import { describe, expect, it } from "vitest"

import { parseStageArgs } from "../../scripts/stage-release.mjs"

describe("stage release arguments", () => {
  it("uses the public release when no local files are given", () => {
    expect(parseStageArgs([])).toBeNull()
  })

  it("requires an archive and checksum together", () => {
    expect(parseStageArgs(["--archive", "release.tar.gz", "--checksum", "release.sha256"], "/srv/nubo")).toEqual({
      archive: "/srv/nubo/release.tar.gz",
      checksum: "/srv/nubo/release.sha256",
    })
    expect(() => parseStageArgs(["--archive", "release.tar.gz"], "/srv/nubo")).toThrow("모두 필요")
  })
})
