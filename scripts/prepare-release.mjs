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
import { failure, section, success } from "./terminal-output.mjs"
import { applySiteRelease, prepareSiteRelease } from "./prepare-site-release.mjs"
import {
  enableAutoCustomize,
  parsePublicUpdateArgs,
  pullSourceCheckout,
  shouldAutoCustomize,
} from "./source-update.mjs"

async function main() {
  const [command = "prepare", ...args] = process.argv.slice(2)
  if (!["prepare", "adopt", "install", "update"].includes(command)) {
    throw new Error(`알 수 없는 릴리스 준비 명령입니다: ${command}`)
  }
  assertSupportedRuntime()
  section(command === "update" ? "NUBO 업데이트 준비" : command === "adopt" ? "기존 사이트 전환 준비" : "NUBO 설치 준비")
  const publicUpdate = command === "update" ? parsePublicUpdateArgs(args) : null
  if (publicUpdate?.pull) pullSourceCheckout(process.cwd())

  const descriptor = await currentRelease()
  const archive = await fetchRelease(descriptor)
  const localRelease = await extractRelease(descriptor, archive, join(process.cwd(), ".nubo", "releases"))

  if (command === "prepare") {
    const link = await prepareGoapi(localRelease)
    success(`NUBO 서버 파일 ${descriptor.version} 준비 완료 (GOAPI: ${link})`)
    return
  }

  let siteRelease = ""
  const existingCustomization = publicUpdate && await shouldAutoCustomize(process.cwd())
  if (existingCustomization && !publicUpdate.dryRun) await enableAutoCustomize(process.cwd())
  const customize = publicUpdate?.customize && existingCustomization
  if (customize) {
    siteRelease = await prepareSiteRelease({
      descriptor,
      official: localRelease,
      dryRun: publicUpdate.dryRun,
      apply: false,
    })
  }

  const systemRelease = stageSystemRelease(localRelease)
  let commandArgs = publicUpdate?.passthrough ?? args
  if (command === "adopt") {
    if (args.includes("--source") || args.some(argument => argument.startsWith("--source="))) {
      throw new Error("--source 경로는 현재 NUBO 프로젝트로 자동 지정됩니다")
    }
    commandArgs = ["--source", process.cwd(), "--node", process.execPath]
    commandArgs.push(...args)
  }
  runNuboctl(command, systemRelease, commandArgs)
  if (command === "update" && siteRelease && !publicUpdate.dryRun) {
    try {
      applySiteRelease(siteRelease)
      await enableAutoCustomize(process.cwd())
    } catch (error) {
      throw new Error(`공식 업데이트는 완료됐지만 커스텀 Web 적용에 실패했습니다: ${error.message}`)
    }
  }
  if (command === "update" && siteRelease && publicUpdate.dryRun) {
    success("커스텀 Web도 새 버전 기준으로 빌드·검증했습니다. 실행 중인 사이트는 바꾸지 않았습니다.")
  }
}

main().catch(error => {
  failure(error.message)
  process.exitCode = 1
})
