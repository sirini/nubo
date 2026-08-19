#!/usr/bin/env node

import { join } from "node:path"
import {
  assertSupportedRuntime,
  currentRelease,
  extractRelease,
  fetchRelease,
  prepareGoapi,
  runNuboctl,
  stageSystemRelease,
} from "./release-download.mjs"

async function main() {
  const [command = "prepare", ...args] = process.argv.slice(2)
  if (!["prepare", "install", "update"].includes(command)) {
    throw new Error(`알 수 없는 릴리스 준비 명령입니다: ${command}`)
  }
  assertSupportedRuntime()
  const descriptor = await currentRelease()
  const archive = await fetchRelease(descriptor)
  const localRelease = await extractRelease(descriptor, archive, join(process.cwd(), ".nubo", "releases"))

  if (command === "prepare") {
    const link = await prepareGoapi(localRelease)
    console.log(`NUBO 서버 런타임 ${descriptor.version} 준비 완료 (GOAPI: ${link})`)
    return
  }

  const systemRelease = stageSystemRelease(localRelease)
  runNuboctl(command, systemRelease, args)
}

main().catch(error => {
  console.error(`오류: ${error.message}`)
  process.exitCode = 1
})
