import { mkdtemp, mkdir, readlink, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { copyTree, createSiteManifest, hashTree, siteReleaseName } from "../../scripts/site-release.mjs"
import { assertDirectCustomizeBase } from "../../scripts/prepare-site-release.mjs"

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

  it("rejects a direct customize before build when the checkout is older than the installed release", async () => {
    const root = await mkdtemp(join(tmpdir(), "nubo-site-base-"))
    try {
      await writeFile(join(root, "manifest.json"), JSON.stringify({ releaseVersion: "1.2.30" }))

      await expect(assertDirectCustomizeBase("1.2.28", root)).rejects.toThrow(
        /현재 운영 NUBO는 1\.2\.30.*소스 checkout은 1\.2\.28/s,
      )
      await expect(assertDirectCustomizeBase("1.2.28", root)).rejects.toThrow("git pull --ff-only")
      await expect(assertDirectCustomizeBase("1.2.30", root)).resolves.toBeUndefined()
    } finally {
      await rm(root, { recursive: true, force: true })
    }
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

  it("preserves internal relative links when copying a Nitro output", async () => {
    const root = await mkdtemp(join(tmpdir(), "nubo-site-copy-"))
    const source = join(root, "source")
    const destination = join(root, "destination")
    await mkdir(join(source, "node_modules", ".nitro", "shared"), { recursive: true })
    await mkdir(join(source, "node_modules", "package"), { recursive: true })
    await writeFile(join(source, "node_modules", ".nitro", "shared", "index.mjs"), "export {}")
    await symlink("../.nitro/shared", join(source, "node_modules", "package", "shared"))

    await copyTree(source, destination)

    expect(await readlink(join(destination, "node_modules", "package", "shared"))).toBe("../.nitro/shared")
    await expect(hashTree(destination)).resolves.toMatch(/^[a-f0-9]{64}$/)
  })
})
