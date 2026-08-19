import { createHash } from "node:crypto"
import { createReadStream, createWriteStream } from "node:fs"
import { access, lstat, mkdir, mkdtemp, readFile, readlink, rename, rm, symlink } from "node:fs/promises"
import { basename, dirname, join, relative, resolve, sep } from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

export function readSetting(content, name) {
  const prefix = `${name}=`
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(prefix))
  return line?.slice(prefix.length).trim() ?? ""
}

export function releaseDescriptor(version, baseURL = "", tag = `v${version}`) {
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`올바르지 않은 NUBO 릴리스 버전입니다: ${version || "(없음)"}`)
  }
  const name = `nubo-${version}-linux-amd64`
  const archive = `${name}.tar.gz`
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
    throw new Error(`올바르지 않은 NUBO 릴리스 태그입니다: ${tag || "(없음)"}`)
  }
  const releaseBase = baseURL || `https://github.com/sirini/nubo/releases/download/${tag}`
  return {
    archive,
    checksum: `${archive}.sha256`,
    name,
    releaseBase: releaseBase.replace(/\/$/, ""),
    version,
  }
}

export function checksumFromFile(content, archive) {
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/)
    if (match && match[2] === archive) return match[1].toLowerCase()
  }
  throw new Error(`${archive}의 SHA-256 값을 찾을 수 없습니다`)
}

export function validateArchiveEntries(content, releaseName) {
  const entries = content.split(/\r?\n/).filter(Boolean)
  if (entries.length === 0) throw new Error("릴리스 압축 파일이 비어 있습니다")
  for (const entry of entries) {
    const clean = entry.replace(/\/$/, "")
    if (entry.includes("\\") || clean.startsWith("/") || clean.split("/").some(part => part === "..")) {
      throw new Error(`위험한 압축 경로입니다: ${entry}`)
    }
    if (clean !== releaseName && !clean.startsWith(`${releaseName}/`)) {
      throw new Error(`예상하지 못한 압축 경로입니다: ${entry}`)
    }
  }
  return entries
}

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
    console.log(`NUBO ${descriptor.version} 릴리스를 내려받습니다...`)
    await download(archiveURL, archivePath)
  } else {
    console.log(`검증된 다운로드 캐시를 사용합니다: ${relative(projectRoot, archivePath)}`)
  }
  const actual = await sha256(archivePath)
  if (actual !== expected) {
    await rm(archivePath, { force: true })
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
  let stat
  try {
    stat = await lstat(linkPath)
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (stat) {
    if (!stat.isSymbolicLink()) {
      throw new Error("goapi-linux에 기존 파일이 있습니다. 보존이 필요하면 옮긴 뒤 다시 실행하세요")
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
    runPrivileged("cp", ["-a", "--", releaseDirectory, destination])
    runPrivileged("chown", ["-R", "root:root", destination])
  }
  return destination
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
