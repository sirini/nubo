#!/usr/bin/env node

import { createHash } from "node:crypto"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  assertSupportedRuntime,
  currentRelease,
  discardStagedSystemRelease,
  extractRelease,
  fetchRelease,
  runReleaseCommand,
  stageSystemRelease,
} from "./release-download.mjs"
import { copyTree, createSiteManifest, hashTree, siteReleaseName, writeChecksums, writeDependencyStamp } from "./site-release.mjs"
import { enableAutoCustomize } from "./source-update.mjs"
import { failure, info, section, success } from "./terminal-output.mjs"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const buildRoot = join(projectRoot, ".nubo", "site-build")
const currentLink = "/opt/nubo/current"

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
    info("처음 한 번 필요한 빌드 도구를 준비합니다...")
    run("npm", ["ci"])
    await writeDependencyStamp(stampPath, lockHash)
  } else {
    info("준비된 빌드 도구를 그대로 사용합니다.")
  }
}

export async function assertDirectCustomizeBase(sourceVersion, installedRelease = currentLink) {
  let manifest
  try {
    manifest = JSON.parse(await readFile(join(installedRelease, "manifest.json"), "utf8"))
  } catch (error) {
    throw new Error(`현재 설치된 NUBO 버전을 확인할 수 없습니다: ${error.message}`)
  }
  const installedVersion = manifest?.releaseVersion
  if (!installedVersion) {
    throw new Error("현재 설치된 NUBO manifest에 releaseVersion이 없습니다")
  }
  if (installedVersion === sourceVersion) return
  throw new Error(
    `현재 운영 NUBO는 ${installedVersion}이지만 이 소스 checkout은 ${sourceVersion}입니다.\n` +
    "구버전 소스로 운영 Web을 만들면 서로 다른 버전의 파일이 섞일 수 있어 빌드를 시작하지 않았습니다.\n" +
    "먼저 git status --short로 변경 파일을 확인하고 사이트 전용 스킨을 보존하세요. " +
    "공식 소스 변경을 정리한 뒤 git pull --ff-only로 코드를 최신으로 갱신하고 nuboctl customize를 다시 실행하세요.",
  )
}

export function applySiteRelease(systemRelease, dryRun = false) {
  runReleaseCommand(systemRelease, ["skin", "apply", "--release", systemRelease, ...(dryRun ? ["--dry-run"] : [])])
}

export async function prepareSiteRelease({ descriptor, official, dryRun = false, apply = true, stage = true } = {}) {
  assertSupportedRuntime()
  section("사이트 꾸미기 빌드")
  descriptor ??= await currentRelease()
  // update는 새 공식 릴리스 전환 전에 다음 버전용 Web을 미리 빌드한다.
  // 직접 customize할 때만 현재 설치와 checkout이 같은 기반인지 먼저 확인한다.
  if (apply && stage) await assertDirectCustomizeBase(descriptor.version)
  if (!official) {
    const archive = await fetchRelease(descriptor)
    official = await extractRelease(descriptor, archive, join(projectRoot, ".nubo", "releases"))
  }

  await ensureDependencies()
  info("수정한 화면을 검사하고 운영용 파일로 만듭니다...")
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

  if (!stage) {
    success(`사이트 수정본을 로컬에서 검증했습니다: ${candidate}`)
    return candidate
  }
  const stagedRelease = stageSystemRelease(candidate)
  await rm(candidate, { recursive: true, force: true })
  success(`사이트 수정본을 안전하게 준비했습니다: ${stagedRelease.path}`)
  if (apply) {
    try {
      applySiteRelease(stagedRelease.path, dryRun)
      if (!dryRun) await enableAutoCustomize(projectRoot)
    } catch (error) {
      discardStagedSystemRelease(stagedRelease)
      throw error
    }
    if (dryRun) discardStagedSystemRelease(stagedRelease)
  }
  return stagedRelease.path
}

async function main() {
  const args = process.argv.slice(2)
  for (const argument of args) {
    if (argument !== "--dry-run") throw new Error(`지원하지 않는 옵션입니다: ${argument}`)
  }
  await prepareSiteRelease({ dryRun: args.includes("--dry-run") })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    failure(error.message)
    process.exitCode = 1
  })
}
