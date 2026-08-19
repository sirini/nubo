#!/usr/bin/env node

import { createHash } from "node:crypto"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  assertSupportedRuntime,
  currentRelease,
  extractRelease,
  fetchRelease,
  runReleaseCommand,
  stageSystemRelease,
} from "./release-download.mjs"
import { copyTree, createSiteManifest, hashTree, siteReleaseName, writeChecksums, writeDependencyStamp } from "./site-release.mjs"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const buildRoot = join(projectRoot, ".nubo", "site-build")

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: projectRoot, encoding: "utf8", stdio: options.capture ? "pipe" : "inherit" })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} 실행에 실패했습니다${options.capture ? `: ${(result.stderr || result.stdout).trim()}` : ""}`)
  return (result.stdout || "").trim()
}

async function sha256File(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex")
}

async function ensureDependencies() {
  const lockPath = join(projectRoot, "package-lock.json")
  const lockHash = await sha256File(lockPath)
  const stampPath = join(buildRoot, "package-lock.sha256")
  let installedHash = ""
  try {
    installedHash = (await readFile(stampPath, "utf8")).trim()
    await readFile(join(projectRoot, "node_modules", ".package-lock.json"))
  } catch {
    installedHash = ""
  }
  if (installedHash !== lockHash) {
    console.log("사이트 빌드 의존성을 준비합니다...")
    run("npm", ["ci"])
    await writeDependencyStamp(stampPath, lockHash)
  } else {
    console.log("준비된 npm 의존성을 재사용합니다.")
  }
}

async function main() {
  assertSupportedRuntime()
  const passthrough = process.argv.slice(2)
  for (const argument of passthrough) {
    if (argument !== "--dry-run") throw new Error(`지원하지 않는 옵션입니다: ${argument}`)
  }

  const descriptor = await currentRelease()
  const archive = await fetchRelease(descriptor)
  const official = await extractRelease(descriptor, archive, join(projectRoot, ".nubo", "releases"))

  await ensureDependencies()
  console.log("로컬 스킨의 타입과 production build를 검증합니다...")
  run("npm", ["run", "typecheck"])
  run("npm", ["run", "build"])

  const skinsHash = await hashTree(join(projectRoot, "app", "skins"), [join(projectRoot, "package-lock.json")])
  const outputHash = await hashTree(join(projectRoot, ".output"))
  const name = siteReleaseName(descriptor.version, outputHash)
  const candidate = join(buildRoot, "releases", name)
  await rm(candidate, { recursive: true, force: true })
  await mkdir(dirname(candidate), { recursive: true })
  await copyTree(official, candidate)
  await rm(join(candidate, "web", ".output"), { recursive: true, force: true })
  await copyTree(join(projectRoot, ".output"), join(candidate, "web", ".output"))

  const baseManifest = JSON.parse(await readFile(join(official, "manifest.json"), "utf8"))
  const sourceCommit = run("git", ["rev-parse", "HEAD"], { capture: true })
  const manifest = createSiteManifest(baseManifest, { sourceCommit, skinsHash })
  await writeFile(join(candidate, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o644 })
  await writeChecksums(candidate)

  const systemRelease = stageSystemRelease(candidate)
  console.log(`로컬 스킨 파생 릴리스를 준비했습니다: ${systemRelease}`)
  runReleaseCommand(systemRelease, ["skin", "apply", "--release", systemRelease, ...passthrough])
}

main().catch(error => {
  console.error(`오류: ${error.message}`)
  process.exitCode = 1
})
