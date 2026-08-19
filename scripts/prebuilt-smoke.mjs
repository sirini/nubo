#!/usr/bin/env node

import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { cp, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const sourceOutput = resolve(process.argv[2] || ".output")
const deploymentDirectory = await mkdtemp(join(tmpdir(), "nubo-prebuilt-smoke-"))
const configurationDirectory = await mkdtemp(join(tmpdir(), "nubo-prebuilt-config-"))
const deployedOutput = join(deploymentDirectory, ".output")
const runtimeEnvironmentFile = join(configurationDirectory, "nubo.env")
const runtimeTitle = "Prebuilt Runtime Community"
const runtimeDomain = "https://prebuilt-runtime.example"
const runtimeVersion = "9.8.7-prebuilt"
const runtimeGoapiBase = "runtime-goapi"
const runtimeProfileSize = "901"
const runtimeContentInsertSize = "902"
const runtimeThumbnailSize = "903"
const runtimeFullSize = "904"
const runtimeFileSizeLimit = "905000"
const runtimeAccessHours = "906"
const runtimeRefreshDays = "907"
const runtimeAdminId = "runtime-admin@prebuilt.example"
const runtimeNuboCommit = "prebuilt-nubo-commit"
const runtimeGoapiCommit = "prebuilt-goapi-commit"
let runtimeGoapiContract = "1"
let webProcess

// 지정한 시간 뒤 다음 smoke 단계로 진행한다.
const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))

// 임시 HTTP 서버를 loopback 임의 포트에 열고 실제 포트를 반환한다.
const listen = (server) =>
  new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen)
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectListen)
      resolveListen(server.address().port)
    })
  })

// 임시 HTTP 서버가 모든 연결을 정리한 뒤 닫힐 때까지 기다린다.
const close = (server) =>
  new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()))
  })

// 운영체제가 고른 비어 있는 포트를 확인한 뒤 테스트 프로세스에 사용한다.
const reservePort = async () => {
  const server = createServer()
  const port = await listen(server)
  await close(server)
  return port
}

// 테스트가 끝나면 Nuxt 프로세스를 정상 종료하고 필요할 때만 강제 종료한다.
const stopWebProcess = async () => {
  if (!webProcess || webProcess.exitCode !== null) return

  webProcess.kill("SIGTERM")
  await Promise.race([
    new Promise((resolveExit) => webProcess.once("exit", resolveExit)),
    delay(3000).then(() => webProcess.kill("SIGKILL")),
  ])
}

// JSON 상태·프록시 응답을 HTTP 정보와 함께 반환한다.
const requestJson = async (url, options) => {
  const response = await fetch(url, options)
  const body = await response.json()
  return { response, body }
}

// Nuxt가 준비될 때까지 짧게 재시도하고 조기 종료 로그를 오류에 포함한다.
const waitForServer = async (url, logs) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (webProcess.exitCode !== null) {
      throw new Error(`Prebuilt server exited with code ${webProcess.exitCode}\n${logs.join("")}`)
    }

    try {
      const response = await fetch(url)
      if (response.ok) return
    }
    catch {
      // The server socket is not ready yet.
    }
    await delay(100)
  }
  throw new Error(`Timed out waiting for ${url}\n${logs.join("")}`)
}

const mockGoapi = createServer((request, response) => {
  const chunks = []
  request.on("data", (chunk) => chunks.push(chunk))
  request.on("end", () => {
    response.setHeader("content-type", "application/json")

    if (request.url === `/${runtimeGoapiBase}/ready`) {
      response.end(JSON.stringify({ status: "ok", service: "goapi" }))
      return
    }
    if (request.url === `/${runtimeGoapiBase}/version`) {
      response.end(
        JSON.stringify({ status: "ok", service: "goapi", version: "mock-runtime", apiContract: runtimeGoapiContract }),
      )
      return
    }

    response.end(
      JSON.stringify({
        success: true,
        error: "",
        code: 0,
        result: {
          method: request.method,
          url: request.url,
          contentType: request.headers["content-type"] || "",
          bodyBytes: Buffer.concat(chunks).length,
        },
      }),
    )
  })
})

try {
  assert.equal((await stat(join(sourceOutput, "server", "index.mjs"))).isFile(), true)
  await cp(sourceOutput, deployedOutput, { recursive: true })

  assert.deepEqual(await readdir(deploymentDirectory), [".output"])
  assert.equal((await readdir(deployedOutput)).includes("server"), true)
  assert.equal((await readdir(deployedOutput)).includes("public"), true)

  await writeFile(join(deploymentDirectory, "manifest.json"), JSON.stringify({
    releaseVersion: runtimeVersion,
    apiContract: "1",
    components: {
      nubo: { version: runtimeVersion, commit: runtimeNuboCommit, dirty: false },
      goapi: { version: "mock-runtime", commit: runtimeGoapiCommit, dirty: false },
    },
  }))

  const goapiPort = await listen(mockGoapi)
  const webPort = await reservePort()
  const logs = []

  await writeFile(
    runtimeEnvironmentFile,
    [
      "NITRO_HOST=127.0.0.1",
      `NITRO_PORT=${webPort}`,
      `NUXT_API_BASE_INTERNAL=http://127.0.0.1:${goapiPort}/${runtimeGoapiBase}`,
      `NUXT_PUBLIC_DOMAIN=${runtimeDomain}`,
      `NUXT_PUBLIC_GOAPI_BASE=${runtimeGoapiBase}`,
      `NUXT_PUBLIC_TITLE=${runtimeTitle}`,
      `NUXT_PUBLIC_VERSION=${runtimeVersion}`,
      `NUXT_PUBLIC_PROFILE_SIZE=${runtimeProfileSize}`,
      `NUXT_PUBLIC_CONTENT_INSERT_SIZE=${runtimeContentInsertSize}`,
      `NUXT_PUBLIC_THUMBNAIL_SIZE=${runtimeThumbnailSize}`,
      `NUXT_PUBLIC_FULL_SIZE=${runtimeFullSize}`,
      `NUXT_PUBLIC_FILE_SIZE_LIMIT=${runtimeFileSizeLimit}`,
      `NUXT_PUBLIC_ACCESS_HOURS=${runtimeAccessHours}`,
      `NUXT_PUBLIC_REFRESH_DAYS=${runtimeRefreshDays}`,
      `NUXT_PUBLIC_ADMIN_ID=${runtimeAdminId}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  )

  const inheritedEnvironment = { ...process.env }
  for (const key of [
    "NITRO_HOST",
    "NITRO_PORT",
    "NUXT_API_BASE_INTERNAL",
    "NUXT_PUBLIC_DOMAIN",
    "NUXT_PUBLIC_GOAPI_BASE",
    "NUXT_PUBLIC_TITLE",
    "NUXT_PUBLIC_VERSION",
    "NUXT_PUBLIC_PROFILE_SIZE",
    "NUXT_PUBLIC_CONTENT_INSERT_SIZE",
    "NUXT_PUBLIC_THUMBNAIL_SIZE",
    "NUXT_PUBLIC_FULL_SIZE",
    "NUXT_PUBLIC_FILE_SIZE_LIMIT",
    "NUXT_PUBLIC_ACCESS_HOURS",
    "NUXT_PUBLIC_REFRESH_DAYS",
    "NUXT_PUBLIC_ADMIN_ID",
  ]) {
    delete inheritedEnvironment[key]
  }

  webProcess = spawn(process.execPath, [
    `--env-file=${runtimeEnvironmentFile}`,
    join(deployedOutput, "server", "index.mjs"),
  ], {
    cwd: deploymentDirectory,
    env: inheritedEnvironment,
    stdio: ["ignore", "pipe", "pipe"],
  })
  webProcess.stdout.on("data", (chunk) => logs.push(chunk.toString()))
  webProcess.stderr.on("data", (chunk) => logs.push(chunk.toString()))

  const baseUrl = `http://127.0.0.1:${webPort}`
  await waitForServer(`${baseUrl}/health`, logs)

  const health = await requestJson(`${baseUrl}/health`)
  assert.equal(health.response.status, 200)
  assert.equal(health.body.status, "ok")

  const ready = await requestJson(`${baseUrl}/ready`)
  assert.equal(ready.response.status, 200)
  assert.equal(ready.body.dependencies.goapi, "ok")

  const version = await requestJson(`${baseUrl}/version`)
  assert.equal(version.response.status, 200)
  assert.equal(version.body.status, "ok")
  assert.equal(version.body.version, runtimeVersion)
  assert.equal(version.body.build.components.nubo.commit, runtimeNuboCommit)
  assert.equal(version.body.build.components.goapi.commit, runtimeGoapiCommit)
  assert.deepEqual(version.body.issues, [])
  assert.equal(version.body.goapi.version, "mock-runtime")

  runtimeGoapiContract = "2"
  const incompatibleVersion = await requestJson(`${baseUrl}/version`)
  assert.equal(incompatibleVersion.body.status, "degraded")
  assert.deepEqual(incompatibleVersion.body.issues, ["api_contract_mismatch"])

  const ssrResponse = await fetch(`${baseUrl}/privacy`)
  const ssrHtml = await ssrResponse.text()
  assert.equal(ssrResponse.status, 200)
  assert.equal(ssrHtml.includes(`<title>${runtimeTitle}</title>`), true, "document title is not runtime-configured")
  for (const runtimeValue of [
    runtimeTitle,
    runtimeDomain,
    runtimeVersion,
    runtimeGoapiBase,
    runtimeProfileSize,
    runtimeContentInsertSize,
    runtimeThumbnailSize,
    runtimeFullSize,
    runtimeFileSizeLimit,
    runtimeAccessHours,
    runtimeRefreshDays,
    runtimeAdminId,
  ]) {
    assert.equal(ssrHtml.includes(runtimeValue), true, `SSR HTML is missing ${runtimeValue}`)
  }

  const assetPath = ssrHtml.match(/(?:href|src)="(\/_nuxt\/[^"?]+)/)?.[1]
  assert.ok(assetPath, "SSR HTML does not reference a built Nuxt asset")
  const assetResponse = await fetch(`${baseUrl}${assetPath}`)
  assert.equal(assetResponse.status, 200)
  assert.ok((await assetResponse.arrayBuffer()).byteLength > 0)

  const proxied = await requestJson(`${baseUrl}/api/auth/signup/status`)
  assert.equal(proxied.response.status, 200)
  assert.equal(proxied.body.result.url, `/${runtimeGoapiBase}/auth/signup/status`)

  const uploadForm = new FormData()
  uploadForm.append("boardUid", "1")
  uploadForm.append("images[]", new Blob(["prebuilt upload body"], { type: "text/plain" }), "poc.txt")
  const upload = await requestJson(`${baseUrl}/api/editor/upload/images`, {
    method: "POST",
    body: uploadForm,
  })
  assert.equal(upload.response.status, 200)
  assert.equal(upload.body.result.url, `/${runtimeGoapiBase}/editor/upload/images`)
  assert.match(upload.body.result.contentType, /^multipart\/form-data; boundary=/)
  assert.ok(upload.body.result.bodyBytes > 0)

  const uploadAssetResponse = await fetch(`${baseUrl}/upload/prebuilt-smoke.txt`)
  assert.equal(uploadAssetResponse.status, 404)

  console.log("PASS prebuilt artifact contains only the self-contained .output directory")
  console.log("PASS deploy-time private and public runtimeConfig overrides")
  console.log("PASS health, readiness, version, SSR, and built static assets")
  console.log("PASS GOAPI route and multipart body proxying")
  console.log("PASS upload files remain outside the replaceable Nuxt artifact")
}
finally {
  await stopWebProcess()
  if (mockGoapi.listening) await close(mockGoapi)
  await rm(deploymentDirectory, { recursive: true, force: true })
  await rm(configurationDirectory, { recursive: true, force: true })
}
