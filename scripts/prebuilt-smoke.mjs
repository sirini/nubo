#!/usr/bin/env node

import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { cp, mkdtemp, readdir, rm, stat } from "node:fs/promises"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const sourceOutput = resolve(process.argv[2] || ".output")
const deploymentDirectory = await mkdtemp(join(tmpdir(), "nubo-prebuilt-smoke-"))
const deployedOutput = join(deploymentDirectory, ".output")
const runtimeTitle = "Prebuilt Runtime Community"
const runtimeDomain = "https://prebuilt-runtime.example"
const runtimeVersion = "9.8.7-prebuilt"
const runtimeGoapiBase = "runtime-goapi"
let webProcess

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))

const listen = (server) =>
  new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen)
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectListen)
      resolveListen(server.address().port)
    })
  })

const close = (server) =>
  new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()))
  })

const reservePort = async () => {
  const server = createServer()
  const port = await listen(server)
  await close(server)
  return port
}

const stopWebProcess = async () => {
  if (!webProcess || webProcess.exitCode !== null) return

  webProcess.kill("SIGTERM")
  await Promise.race([
    new Promise((resolveExit) => webProcess.once("exit", resolveExit)),
    delay(3000).then(() => webProcess.kill("SIGKILL")),
  ])
}

const requestJson = async (url, options) => {
  const response = await fetch(url, options)
  const body = await response.json()
  return { response, body }
}

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
        JSON.stringify({ status: "ok", service: "goapi", version: "mock-runtime", apiContract: "1" }),
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

  const goapiPort = await listen(mockGoapi)
  const webPort = await reservePort()
  const logs = []

  webProcess = spawn(process.execPath, [join(deployedOutput, "server", "index.mjs")], {
    cwd: deploymentDirectory,
    env: {
      ...process.env,
      NITRO_HOST: "127.0.0.1",
      NITRO_PORT: String(webPort),
      NUXT_API_BASE_INTERNAL: `http://127.0.0.1:${goapiPort}/${runtimeGoapiBase}`,
      NUXT_PUBLIC_DOMAIN: runtimeDomain,
      NUXT_PUBLIC_GOAPI_BASE: runtimeGoapiBase,
      NUXT_PUBLIC_TITLE: runtimeTitle,
      NUXT_PUBLIC_VERSION: runtimeVersion,
    },
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
  assert.equal(version.body.version, runtimeVersion)
  assert.equal(version.body.goapi.version, "mock-runtime")

  const ssrResponse = await fetch(`${baseUrl}/privacy`)
  const ssrHtml = await ssrResponse.text()
  assert.equal(ssrResponse.status, 200)
  for (const runtimeValue of [runtimeTitle, runtimeDomain, runtimeVersion, runtimeGoapiBase]) {
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
}
