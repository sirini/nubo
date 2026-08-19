import { createHash } from "node:crypto"
import { createReadStream } from "node:fs"
import { lstat, mkdir, readlink, readdir, readFile, realpath, writeFile } from "node:fs/promises"
import { dirname, join, relative, sep } from "node:path"
import { pipeline } from "node:stream/promises"

async function treeEntries(root, directory = root) {
  const entries = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) entries.push(...await treeEntries(root, path))
    else if (entry.isFile()) entries.push({ path, type: "file" })
    else if (entry.isSymbolicLink()) {
      const target = await realpath(path)
      const outside = relative(await realpath(root), target)
      if (outside === ".." || outside.startsWith(`..${sep}`)) {
        throw new Error(`사이트 빌드 밖을 가리키는 심볼릭 링크입니다: ${relative(root, path)}`)
      }
      entries.push({ path, target: await readlink(path), type: "link" })
    } else throw new Error(`사이트 빌드에는 일반 파일과 내부 심볼릭 링크만 사용할 수 있습니다: ${relative(root, path)}`)
  }
  return entries.sort((left, right) => left.path.localeCompare(right.path))
}

async function hashFile(path, hash) {
  hash.update(await readFile(path))
}

export async function hashTree(root, extraFiles = []) {
  const info = await lstat(root)
  if (!info.isDirectory()) throw new Error(`디렉터리가 아닙니다: ${root}`)
  const hash = createHash("sha256")
  for (const entry of await treeEntries(root)) {
    hash.update(relative(root, entry.path).replaceAll("\\", "/"))
    hash.update("\0")
    if (entry.type === "file") await hashFile(entry.path, hash)
    else hash.update(entry.target)
    hash.update("\0")
  }
  for (const path of extraFiles) {
    hash.update(path)
    hash.update("\0")
    await hashFile(path, hash)
    hash.update("\0")
  }
  return hash.digest("hex")
}

export function siteReleaseName(version, outputHash) {
  if (!/^\d+\.\d+\.\d+$/.test(version) || !/^[a-f0-9]{64}$/.test(outputHash)) {
    throw new Error("사이트 파생 릴리스 이름을 만들 수 없습니다")
  }
  return `nubo-${version}-site-${outputHash.slice(0, 12)}-linux-amd64`
}

export function createSiteManifest(base, { sourceCommit, skinsHash }) {
  if (!base?.releaseVersion || !sourceCommit || !/^[a-f0-9]{64}$/.test(skinsHash)) {
    throw new Error("사이트 빌드 manifest 입력이 올바르지 않습니다")
  }
  return {
    ...base,
    siteBuild: {
      baseVersion: base.releaseVersion,
      sourceCommit,
      skinsHash,
    },
  }
}

export async function writeChecksums(releaseRoot) {
  const lines = []
  for (const entry of await treeEntries(releaseRoot)) {
    if (entry.type !== "file") continue
    const name = relative(releaseRoot, entry.path).replaceAll("\\", "/")
    if (name === "checksums.txt") continue
    const hash = createHash("sha256")
    await pipeline(createReadStream(entry.path), hash)
    lines.push(`${hash.digest("hex")}  ./${name}`)
  }
  await writeFile(join(releaseRoot, "checksums.txt"), `${lines.join("\n")}\n`, { mode: 0o644 })
}

export async function writeDependencyStamp(path, lockHash) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${lockHash}\n`, { mode: 0o600 })
}
