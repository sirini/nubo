#!/usr/bin/env node

import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  assertSupportedRuntime,
  currentRelease,
  extractRelease,
  fetchRelease,
  parseManualReleaseArgs,
  stageSystemRelease,
  verifyManualRelease,
} from "./release-download.mjs"
import { failure, section, success } from "./terminal-output.mjs"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

export function parseStageArgs(args, cwd = process.cwd()) {
  if (args.length === 0) return null
  return parseManualReleaseArgs(args, cwd)
}

export async function stageOfficialRelease(args = process.argv.slice(2)) {
  assertSupportedRuntime()
  section("NUBO 공식 릴리스 준비")
  const descriptor = await currentRelease()
  const manual = parseStageArgs(args)
  const archive = manual
    ? await verifyManualRelease(descriptor, manual.archive, manual.checksum)
    : await fetchRelease(descriptor)
  const local = await extractRelease(descriptor, archive, join(projectRoot, ".nubo", "releases"))
  const staged = stageSystemRelease(local)
  success(`검증한 릴리스를 준비했습니다: ${staged.path}`)
  console.log(`\n미리보기: sudo ${staged.path}/nuboctl apply ${staged.path} --dry-run`)
  console.log(`실제 적용: sudo ${staged.path}/nuboctl apply ${staged.path}`)
  return staged.path
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  stageOfficialRelease().catch(error => {
    failure(error.message)
    process.exitCode = 1
  })
}
