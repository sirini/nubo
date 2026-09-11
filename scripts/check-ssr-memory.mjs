// Run after npm run build. Uses synthetic GOAPI responses; never contacts a live backend.
import assert from "node:assert/strict"
import http from "node:http"
import { setTimeout as delay } from "node:timers/promises"

assert.equal(typeof global.gc, "function", "Run with node --expose-gc")

const fixture = http.createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname
  let payload
  switch (path) {
    case "/goapi/version":
      payload = { status: "ok", apiContract: "1", version: "1.3.1" }
      break
    case "/goapi/skin/settings":
      payload = { success: true, result: {} }
      break
    case "/goapi/auth/load":
      payload = { success: true, result: null }
      break
    case "/goapi/home/sidebar/links":
      payload = { success: true, result: [] }
      break
    default:
      res.statusCode = 404
      payload = { success: false, error: "Unexpected fixture request" }
  }
  res.setHeader("content-type", "application/json")
  res.end(JSON.stringify(payload))
})
const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
await listen(fixture)
const reservation = http.createServer()
await listen(reservation)
const port = reservation.address().port
await new Promise((resolve) => reservation.close(resolve))

Object.assign(process.env, {
  NITRO_HOST: "127.0.0.1",
  NITRO_PORT: String(port),
  NUXT_API_BASE_INTERNAL: `http://127.0.0.1:${fixture.address().port}/goapi`,
  NUXT_PUBLIC_API_BASE: "/api",
  NUXT_APP_BASE_URL: "/",
})
delete process.env.NITRO_UNIX_SOCKET

try {
  await import("../.output/server/index.mjs")
  const base = `http://127.0.0.1:${port}`
  const request = async (path, status) => {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(10000) })
    const html = await response.text()
    assert.equal(response.status, status, path)
    if (status === 200) assert.match(html, /type="password"/, "Login form must be server rendered")
  }
  // Warm up modules and the JIT before measuring retained heap.
  for (let i = 0; i < 100; i++) await request("/auth/login", 200)
  await delay(250)
  global.gc()
  const initial = process.memoryUsage().heapUsed
  let maximum = initial
  for (let batch = 1; batch <= 10; batch++) {
    for (let i = 0; i < 100; i++) await request("/auth/login", 200)
    await delay(250)
    global.gc()
    const heap = process.memoryUsage().heapUsed
    maximum = Math.max(maximum, heap)
    console.log(JSON.stringify({ requests: batch * 100, heapMiB: +(heap / 2 ** 20).toFixed(1) }))
  }
  assert.ok(maximum - initial < 32 * 2 ** 20,
    `SSR retained ${(maximum - initial) / 2 ** 20} MiB after warmup; check NODE_ENV and global registries`)
  console.log("SSR memory check passed (1,000 login requests after warmup).")
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
