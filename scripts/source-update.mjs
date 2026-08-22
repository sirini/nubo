import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { info } from "./terminal-output.mjs"

const markerName = join(".nubo", "site-build", "auto-customize.json")

function run(command, args, root, capture = false) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const detail = capture ? `: ${(result.stderr || result.stdout).trim()}` : ""
    throw new Error(`${command} ${args.join(" ")} 실행에 실패했습니다${detail}`)
  }
  return (result.stdout || "").trim()
}

export function parsePublicUpdateArgs(args) {
  const options = { pull: true, customize: true, dryRun: false, passthrough: [] }
  for (const argument of args) {
    if (argument === "--no-pull") options.pull = false
    else if (argument === "--no-customize") options.customize = false
    else {
      if (argument === "--dry-run") options.dryRun = true
      options.passthrough.push(argument)
    }
  }
  return options
}

export function isCustomSkinPath(path) {
  const match = path.match(/^app\/skins\/([^/]+)(?:\/|$)/)
  return Boolean(match && !match[1].startsWith("nubo-basic-"))
}

export function assertSafeSourceChanges(paths) {
  const blocked = [...new Set(paths.filter(Boolean))].filter(path => !isCustomSkinPath(path))
  if (blocked.length === 0) return
  const detail = blocked.slice(0, 8).map(path => `  - ${path}`).join("\n")
  throw new Error(
    `공식 소스 변경이 남아 있어 자동 pull을 중단합니다. 커밋하거나 되돌린 뒤 다시 실행하세요:\n${detail}`,
  )
}

function changedSourcePaths(root) {
  const commands = [
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]
  return commands.flatMap(args => run("git", args, root, true).split(/\r?\n/).filter(Boolean))
}

export function pullSourceCheckout(root) {
  const branch = run("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], root, true)
  const upstream = run(
    "git",
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"],
    root,
    true,
  )
  assertSafeSourceChanges(changedSourcePaths(root))
  info(`NUBO 소스를 fast-forward로 갱신합니다: ${branch} ← ${upstream}`)
  run("git", ["pull", "--ff-only"], root)
}

export async function installedSiteIsCustomized(currentLink = "/opt/nubo/current") {
  try {
    const manifest = JSON.parse(await readFile(join(currentLink, "manifest.json"), "utf8"))
    return Boolean(manifest.siteBuild?.baseVersion && manifest.siteBuild?.skinsHash)
  } catch (error) {
    if (error?.code === "ENOENT") return false
    throw new Error(`현재 설치의 커스텀 스킨 상태를 읽을 수 없습니다: ${error.message}`)
  }
}

export async function autoCustomizeEnabled(root) {
  try {
    const marker = JSON.parse(await readFile(join(root, markerName), "utf8"))
    return marker.schemaVersion === 1 && marker.enabled === true
  } catch (error) {
    if (error?.code === "ENOENT") return false
    throw new Error(`자동 커스텀 설정을 읽을 수 없습니다: ${error.message}`)
  }
}

export async function enableAutoCustomize(root) {
  const path = join(root, markerName)
  await mkdir(join(root, ".nubo", "site-build"), { recursive: true })
  await writeFile(
    path,
    `${JSON.stringify({ schemaVersion: 1, enabled: true, source: root }, null, 2)}\n`,
    { mode: 0o600 },
  )
}

export async function shouldAutoCustomize(root, currentLink) {
  return await autoCustomizeEnabled(root) || await installedSiteIsCustomized(currentLink)
}
