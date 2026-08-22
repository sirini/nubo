import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"

import {
  assertSafeSourceChanges,
  autoCustomizeEnabled,
  enableAutoCustomize,
  installedSiteIsCustomized,
  isCustomSkinPath,
  parsePublicUpdateArgs,
  pullSourceCheckout,
  shouldAutoCustomize,
} from "../../scripts/source-update.mjs"

function git(root: string, ...args: string[]) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" })
  if (result.status !== 0) throw new Error(result.stderr || result.stdout)
}

describe("source update workflow", () => {
  it("consumes public-only update options", () => {
    expect(parsePublicUpdateArgs([
      "--dry-run",
      "--no-pull",
      "--no-customize",
      "--non-interactive",
    ])).toEqual({
      pull: false,
      customize: false,
      dryRun: true,
      passthrough: ["--dry-run", "--non-interactive"],
    })
  })

  it("allows site-specific skins but protects official source changes", () => {
    expect(isCustomSkinPath("app/skins/sensta-me-home/Home.vue")).toBe(true)
    expect(isCustomSkinPath("app/skins/nubo-basic-home/Home.vue")).toBe(false)
    expect(() => assertSafeSourceChanges([
      "app/skins/sensta-me-home/Home.vue",
      "app/skins/sensta-me-layout/Layout.vue",
    ])).not.toThrow()
    expect(() => assertSafeSourceChanges(["app/skins/nubo-basic-home/Home.vue"]))
      .toThrow("공식 소스 변경")
    expect(() => assertSafeSourceChanges(["package.json"]))
      .toThrow("공식 소스 변경")
  })

  it("remembers customization across an interrupted official update", async () => {
    const root = await mkdtemp(join(tmpdir(), "nubo-source-update-"))
    const current = join(root, "current")
    await mkdir(current)
    await writeFile(join(current, "manifest.json"), JSON.stringify({
      siteBuild: { baseVersion: "1.2.18", skinsHash: "abc" },
    }))

    expect(await installedSiteIsCustomized(current)).toBe(true)
    expect(await shouldAutoCustomize(root, current)).toBe(true)
    await enableAutoCustomize(root)
    await writeFile(join(current, "manifest.json"), JSON.stringify({ releaseVersion: "1.2.19" }))
    expect(await installedSiteIsCustomized(current)).toBe(false)
    expect(await autoCustomizeEnabled(root)).toBe(true)
    expect(await shouldAutoCustomize(root, current)).toBe(true)
  })

  it("fast-forwards while preserving a separate custom skin", async () => {
    const root = await mkdtemp(join(tmpdir(), "nubo-source-pull-"))
    const remote = join(root, "remote.git")
    const seed = join(root, "seed")
    const server = join(root, "server")
    git(root, "init", "--bare", remote)
    git(root, "clone", remote, seed)
    git(seed, "config", "user.email", "test@example.com")
    git(seed, "config", "user.name", "NUBO test")
    await mkdir(join(seed, "app", "skins", "nubo-basic-home"), { recursive: true })
    await writeFile(join(seed, "README.md"), "first\n")
    await writeFile(join(seed, "app", "skins", "nubo-basic-home", "Home.vue"), "official\n")
    git(seed, "add", ".")
    git(seed, "commit", "-m", "initial")
    git(seed, "push", "-u", "origin", "HEAD")
    git(root, "clone", remote, server)

    await mkdir(join(server, "app", "skins", "sensta-me-home"), { recursive: true })
    await writeFile(join(server, "app", "skins", "sensta-me-home", "Home.vue"), "custom\n")
    await writeFile(join(seed, "README.md"), "second\n")
    git(seed, "add", "README.md")
    git(seed, "commit", "-m", "update")
    git(seed, "push")

    pullSourceCheckout(server)
    expect(await readFile(join(server, "README.md"), "utf8")).toBe("second\n")
    expect(await readFile(join(server, "app", "skins", "sensta-me-home", "Home.vue"), "utf8"))
      .toBe("custom\n")

    await writeFile(join(server, "app", "skins", "nubo-basic-home", "Home.vue"), "modified\n")
    expect(() => pullSourceCheckout(server)).toThrow("공식 소스 변경")
  })
})
