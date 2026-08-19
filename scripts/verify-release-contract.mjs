#!/usr/bin/env node

import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptPath = fileURLToPath(import.meta.url)
const projectRoot = resolve(dirname(scriptPath), "..")

export const readReleaseContracts = async (nuboRoot, goapiRoot) => {
  const nubo = JSON.parse(await readFile(resolve(nuboRoot, "deploy/api-contract.json"), "utf8"))
  const goapi = (await readFile(
    resolve(goapiRoot, "internal/handlers/api-contract-version.txt"),
    "utf8",
  )).trim()
  if (typeof nubo.version !== "string" || !nubo.version || !goapi) {
    throw new Error("NUBO 또는 GOAPI API contract version이 비어 있습니다")
  }
  return { nubo: nubo.version, goapi }
}

export const verifyReleaseContracts = async (nuboRoot, goapiRoot) => {
  const contracts = await readReleaseContracts(nuboRoot, goapiRoot)
  if (contracts.nubo !== contracts.goapi) {
    throw new Error(`API contract version이 다릅니다: NUBO ${contracts.nubo}, GOAPI ${contracts.goapi}`)
  }
  return contracts.nubo
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const goapiRoot = resolve(process.env.GOAPI_SOURCE_DIR || resolve(projectRoot, "../goapi.git"))
  try {
    const version = await verifyReleaseContracts(projectRoot, goapiRoot)
    console.log(`API contract v${version}: NUBO와 GOAPI 일치`)
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
