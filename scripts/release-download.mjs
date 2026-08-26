import { createHash } from "node:crypto"
import { createReadStream, createWriteStream, realpathSync } from "node:fs"
import { access, lstat, mkdir, mkdtemp, readFile, readlink, rename, rm, symlink } from "node:fs/promises"
import { basename, dirname, join, relative, resolve, sep } from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { info } from "./terminal-output.mjs"
import {
  checksumFromFile,
  parseManualReleaseArgs,
  readSetting,
  releaseDescriptor,
  validateArchiveEntries,
} from "./release-descriptor.mjs"

export { checksumFromFile, parseManualReleaseArgs, readSetting, releaseDescriptor, validateArchiveEntries }

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function run(command, args, options = {}) {
  const { capture = false, ...spawnOptions } = options
  const result = spawnSync(command, args, { encoding: "utf8", stdio: capture ? "pipe" : "inherit", ...spawnOptions })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const detail = capture ? `: ${(result.stderr || result.stdout).trim()}` : ""
    throw new Error(`${command} 실행에 실패했습니다${detail}`)
  }
  return result.stdout ?? ""
}

function runPrivileged(command, args, options = {}) {
  if (typeof process.getuid === "function" && process.getuid() === 0) return run(command, args, options)
  return run("sudo", [command, ...args], options)
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function sha256(path) {
  const hash = createHash("sha256")
  await pipeline(createReadStream(path), hash)
  return hash.digest("hex")
}

async function download(url, destination) {
  const response = await fetch(url, { redirect: "follow" })
  if (!response.ok || !response.body) {
    throw new Error(`릴리스를 내려받지 못했습니다 (${response.status}): ${url}`)
  }
  await mkdir(dirname(destination), { recursive: true })
  const temporary = `${destination}.part-${process.pid}`
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary, { mode: 0o600 }))
    await rename(temporary, destination)
  } finally {
    await rm(temporary, { force: true })
  }
}

async function downloadText(url) {
  const response = await fetch(url, { redirect: "follow" })
  if (!response.ok) throw new Error(`릴리스 체크섬을 내려받지 못했습니다 (${response.status}): ${url}`)
  return response.text()
}

export async function currentRelease() {
  const environment = await readFile(join(projectRoot, "env.sample"), "utf8")
  const sources = JSON.parse(await readFile(join(projectRoot, "deploy", "release-sources.json"), "utf8"))
  const version = readSetting(environment, "NUXT_PUBLIC_VERSION")
  if (sources.channel?.version !== version) {
    throw new Error(`릴리스 채널과 NUBO 버전이 일치하지 않습니다: ${sources.channel?.version} != ${version}`)
  }
  return releaseDescriptor(version, process.env.NUBO_RELEASE_BASE_URL, sources.channel.tag)
}

export async function fetchRelease(descriptor, cacheRoot = join(projectRoot, ".nubo", "downloads")) {
  const checksumURL = `${descriptor.releaseBase}/${descriptor.checksum}`
  const archiveURL = `${descriptor.releaseBase}/${descriptor.archive}`
  const expected = checksumFromFile(await downloadText(checksumURL), descriptor.archive)
  const archivePath = join(cacheRoot, descriptor.archive)
  if (!await exists(archivePath) || await sha256(archivePath) !== expected) {
    info(`NUBO ${descriptor.version} 공식 파일을 내려받습니다...`)
    await download(archiveURL, archivePath)
  } else {
    info(`이미 검증한 다운로드를 사용합니다: ${relative(projectRoot, archivePath)}`)
  }
  const actual = await sha256(archivePath)
  if (actual !== expected) {
    await rm(archivePath, { force: true })
    throw new Error(`릴리스 SHA-256이 일치하지 않습니다: expected ${expected}, got ${actual}`)
  }
  return archivePath
}

export async function verifyManualRelease(descriptor, archivePath, checksumPath) {
  const expected = checksumFromFile(await readFile(checksumPath, "utf8"), descriptor.archive)
  const actual = await sha256(archivePath)
  if (actual !== expected) {
    throw new Error(`릴리스 SHA-256이 일치하지 않습니다: expected ${expected}, got ${actual}`)
  }
  return archivePath
}

export async function extractRelease(descriptor, archivePath, destinationRoot) {
  await mkdir(destinationRoot, { recursive: true })
  const destination = join(destinationRoot, descriptor.name)
  const verify = async () => {
    const manifest = JSON.parse(await readFile(join(destination, "manifest.json"), "utf8"))
    if (manifest.releaseVersion !== descriptor.version || manifest.target?.os !== "linux" || manifest.target?.arch !== "amd64") {
      throw new Error("릴리스 manifest의 버전 또는 실행 대상이 일치하지 않습니다")
    }
    run("sha256sum", ["--check", "--quiet", "checksums.txt"], { cwd: destination })
  }

  if (await exists(destination)) {
    try {
      await verify()
      return destination
    } catch {
      await rm(destination, { recursive: true, force: true })
    }
  }
  if (!await exists(destination)) {
    const temporaryRoot = await mkdtemp(join(destinationRoot, ".extract-"))
    try {
      const listing = run("tar", ["-tzf", archivePath], { capture: true })
      validateArchiveEntries(listing, descriptor.name)
      run("tar", ["-xzf", archivePath, "-C", temporaryRoot, "--no-same-owner", "--no-same-permissions"])
      await rename(join(temporaryRoot, descriptor.name), destination)
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true })
    }
  }
  await verify()
  return destination
}

export async function prepareGoapi(releaseDirectory) {
  const linkPath = join(projectRoot, "goapi-linux")
  const targetPath = join(releaseDirectory, "bin", "goapi")
  await ensureSourceLink(linkPath, targetPath, "goapi-linux")
  await ensureSourceLink(join(projectRoot, "nubo-market"), join(releaseDirectory, "nubo-market"), "nubo-market")
  return linkPath
}

export async function ensureSourceLink(linkPath, targetPath, label) {
  let stat
  try {
    stat = await lstat(linkPath)
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (stat) {
    if (!stat.isSymbolicLink()) {
      throw new Error(`${label}에 기존 파일이 있습니다. 보존이 필요하면 옮긴 뒤 다시 실행하세요`)
    }
    if (resolve(dirname(linkPath), await readlink(linkPath)) === targetPath) return linkPath
    await rm(linkPath)
  }
  await symlink(relative(dirname(linkPath), targetPath).split(sep).join("/"), linkPath)
  return linkPath
}

export function stageSystemRelease(releaseDirectory) {
  const releasesRoot = "/opt/nubo/releases"
  const destination = join(releasesRoot, basename(releaseDirectory))
  runPrivileged("install", ["-d", "-m", "0755", releasesRoot])
  const testCommand = typeof process.getuid === "function" && process.getuid() === 0 ? "test" : "sudo"
  const testArgs = testCommand === "sudo" ? ["test", "-d", destination] : ["-d", destination]
  const present = spawnSync(testCommand, testArgs, { stdio: "ignore" }).status === 0
  if (!present) {
    const temporary = `${destination}.stage-${process.pid}`
    try {
      runPrivileged("rm", ["-rf", "--", temporary])
      runPrivileged("cp", ["-a", "--", releaseDirectory, temporary])
      runPrivileged("chown", ["-R", "root:root", temporary])
      runPrivileged("mv", ["-T", "--", temporary, destination])
    } finally {
      try {
        runPrivileged("rm", ["-rf", "--", temporary])
      } catch {
        // 원래 staging 오류를 유지하며 임시 경로는 다음 실행에서 다시 회수한다.
      }
    }
  }
  return { created: !present, path: destination }
}

// 이번 실행이 새로 배치했지만 적용하지 못한 공식·파생 릴리스만 회수한다.
export function discardStagedSystemRelease(stagedRelease) {
  if (!stagedRelease?.created) return false
  const releasesRoot = "/opt/nubo/releases"
  const destination = resolve(stagedRelease.path)
  const releaseName = /^nubo-[0-9A-Za-z.+-]+(?:-site-[a-f0-9]{12})?-linux-amd64$/
  if (dirname(destination) !== releasesRoot || !releaseName.test(basename(destination))) {
    throw new Error(`정리할 수 없는 릴리스 경로입니다: ${stagedRelease.path}`)
  }
  for (const link of ["/opt/nubo/current", "/opt/nubo/previous"]) {
    try {
      if (realpathSync(link) === destination) {
        info(`사용 중인 릴리스는 보존합니다: ${destination}`)
        return false
      }
    } catch {
      // 링크가 없거나 끊어졌으면 이 후보를 참조하지 않는다.
    }
  }
  runPrivileged("rm", ["-rf", "--", destination])
  info(`적용하지 못한 릴리스를 정리했습니다: ${destination}`)
  return true
}

export function systemReleaseIsCurrent(releaseDirectory, currentLink = "/opt/nubo/current") {
  try {
    return realpathSync(currentLink) === realpathSync(releaseDirectory)
  } catch {
    return false
  }
}

export function runNuboctl(command, releaseDirectory, args) {
  if (args.includes("--release") || args.some(argument => argument.startsWith("--release="))) {
    throw new Error("--release 경로는 다운로드한 공식 릴리스로 자동 지정됩니다")
  }
  runPrivileged(join(releaseDirectory, "nuboctl"), [command, "--release", releaseDirectory, ...args])
}

export function runReleaseCommand(releaseDirectory, args) {
  runPrivileged(join(releaseDirectory, "nuboctl"), args)
}

export function assertSupportedRuntime() {
  const major = Number.parseInt(process.versions.node.split(".")[0], 10)
  if (major < 22) throw new Error(`Node.js 22 이상이 필요합니다: ${process.version}`)
  if (process.platform !== "linux" || process.arch !== "x64") {
    throw new Error(`공식 릴리스는 Linux amd64에서만 실행할 수 있습니다: ${process.platform} ${process.arch}`)
  }
}
