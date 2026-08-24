import { createHash } from "node:crypto"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  checksumFromFile,
  parseManualReleaseArgs,
  readSetting,
  releaseDescriptor,
  validateArchiveEntries,
  verifyManualRelease,
} from "../../scripts/release-download.mjs"

describe("release download contract", () => {
  it("derives one integrated GitHub release asset from the runtime version", () => {
    const version = readSetting("GOAPI_VERSION=1.2.2\nNUXT_PUBLIC_VERSION=1.2.2\n", "NUXT_PUBLIC_VERSION")
    expect(releaseDescriptor(version)).toEqual({
      archive: "nubo-1.2.2-linux-amd64.tar.gz",
      checksum: "nubo-1.2.2-linux-amd64.tar.gz.sha256",
      name: "nubo-1.2.2-linux-amd64",
      releaseBase: "https://github.com/sirini/nubo/releases/download/v1.2.2",
      version: "1.2.2",
    })
  })

  it("can point the source checkout at a prerelease candidate", () => {
    expect(releaseDescriptor("1.2.2", "", "v1.2.2-rc.1").releaseBase).toBe(
      "https://github.com/sirini/nubo/releases/download/v1.2.2-rc.1",
    )
  })

  it("reads only the checksum for the expected archive", () => {
    const hash = "a".repeat(64)
    expect(checksumFromFile(`${hash}  nubo-1.2.2-linux-amd64.tar.gz\n`, "nubo-1.2.2-linux-amd64.tar.gz")).toBe(hash)
    expect(() => checksumFromFile(`${hash}  other.tar.gz\n`, "nubo-1.2.2-linux-amd64.tar.gz")).toThrow()
  })

  it("allows only entries below the versioned release root", () => {
    const root = "nubo-1.2.2-linux-amd64"
    expect(validateArchiveEntries(`${root}/\n${root}/bin/goapi\n`, root)).toHaveLength(2)
    expect(() => validateArchiveEntries(`${root}/../escape\n`, root)).toThrow("위험한 압축 경로")
    expect(() => validateArchiveEntries("etc/passwd\n", root)).toThrow("예상하지 못한 압축 경로")
  })

  it("resolves both files required for a manual release import", () => {
    expect(
      parseManualReleaseArgs(
        ["--archive", "release.tar.gz", "--checksum=release.tar.gz.sha256"],
        "/srv/nubo",
      ),
    ).toEqual({
      archive: "/srv/nubo/release.tar.gz",
      checksum: "/srv/nubo/release.tar.gz.sha256",
    })
    expect(() => parseManualReleaseArgs(["--archive", "release.tar.gz"])).toThrow(
      "--archive와 --checksum",
    )
  })

  it("verifies a manually supplied release before extraction", async () => {
    const directory = await mkdtemp(join(tmpdir(), "nubo-manual-release-"))
    const descriptor = releaseDescriptor("1.2.2")
    const archive = join(directory, descriptor.archive)
    const checksum = join(directory, descriptor.checksum)
    try {
      const content = "verified release"
      const hash = createHash("sha256").update(content).digest("hex")
      await writeFile(archive, content)
      await writeFile(checksum, `${hash}  ${descriptor.archive}\n`)

      await expect(verifyManualRelease(descriptor, archive, checksum)).resolves.toBe(archive)
      await writeFile(archive, "tampered release")
      await expect(verifyManualRelease(descriptor, archive, checksum)).rejects.toThrow(
        "SHA-256이 일치하지 않습니다",
      )
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
