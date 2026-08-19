import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { verifyReleaseContracts } from "../../scripts/verify-release-contract.mjs"

const temporaryRoots: string[] = []

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

const contractRoots = async (nuboVersion: string, goapiVersion: string) => {
  const root = await mkdtemp(join(tmpdir(), "nubo-release-contract-"))
  temporaryRoots.push(root)
  const nubo = join(root, "nubo")
  const goapi = join(root, "goapi")
  await mkdir(join(nubo, "deploy"), { recursive: true })
  await mkdir(join(goapi, "internal/handlers"), { recursive: true })
  await writeFile(join(nubo, "deploy/api-contract.json"), JSON.stringify({ version: nuboVersion }))
  await writeFile(join(goapi, "internal/handlers/api-contract-version.txt"), `${goapiVersion}\n`)
  return { nubo, goapi }
}

describe("integrated release API contract", () => {
  it("accepts matching NUBO and GOAPI versions", async () => {
    const roots = await contractRoots("1", "1")
    await expect(verifyReleaseContracts(roots.nubo, roots.goapi)).resolves.toBe("1")
  })

  it("rejects a mismatched release before packaging", async () => {
    const roots = await contractRoots("1", "2")
    await expect(verifyReleaseContracts(roots.nubo, roots.goapi)).rejects.toThrow(
      "API contract version이 다릅니다: NUBO 1, GOAPI 2",
    )
  })
})
