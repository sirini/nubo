import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { createSiteManifest, hashTree, siteReleaseName } from "../../scripts/site-release.mjs"

describe("local site release", () => {
  it("records the official base and local skin source", () => {
    const skinsHash = "a".repeat(64)
    const manifest = createSiteManifest({ releaseVersion: "1.2.8", schemaVersion: 2 }, {
      sourceCommit: "abc123",
      skinsHash,
    })
    expect(manifest.siteBuild).toEqual({ baseVersion: "1.2.8", sourceCommit: "abc123", skinsHash })
    expect(siteReleaseName("1.2.8", "b".repeat(64))).toBe("nubo-1.2.8-site-bbbbbbbbbbbb-linux-amd64")
  })

  it("hashes files and safe internal links but rejects links outside the build", async () => {
    const root = await mkdtemp(join(tmpdir(), "nubo-site-hash-"))
    await mkdir(join(root, "files"))
    await writeFile(join(root, "files", "skin.vue"), "first")
    await symlink("files/skin.vue", join(root, "skin-link"))
    const first = await hashTree(root)
    await writeFile(join(root, "files", "skin.vue"), "second")
    expect(await hashTree(root)).not.toBe(first)
    await symlink("/etc/passwd", join(root, "outside"))
    await expect(hashTree(root)).rejects.toThrow("사이트 빌드 밖")
  })
})
