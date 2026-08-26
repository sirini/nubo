import { resolve } from "node:path"

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

export function parseManualReleaseArgs(args, cwd = process.cwd()) {
  const values = { archive: "", checksum: "" }
  for (let index = 0; index < args.length; index++) {
    const argument = args[index]
    let matched = false
    for (const name of ["archive", "checksum"]) {
      if (argument === `--${name}`) {
        const value = args[++index]
        if (!value || value.startsWith("--")) {
          throw new Error(`--${name} 뒤에 파일 경로가 필요합니다`)
        }
        values[name] = value
        matched = true
      } else if (argument.startsWith(`--${name}=`)) {
        values[name] = argument.slice(name.length + 3)
        matched = true
      }
    }
    if (!matched) {
      throw new Error(`알 수 없는 수동 준비 옵션입니다: ${argument}`)
    }
  }
  if (!values.archive || !values.checksum) {
    throw new Error("수동 준비에는 --archive와 --checksum 파일이 모두 필요합니다")
  }
  return {
    archive: resolve(cwd, values.archive),
    checksum: resolve(cwd, values.checksum),
  }
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
