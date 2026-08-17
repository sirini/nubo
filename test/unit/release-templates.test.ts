import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const readProjectFile = (path: string) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8")

describe("Linux release templates", () => {
  it("keeps service paths renderable and the web process read-only", async () => {
    const [goapi, web] = await Promise.all([
      readProjectFile("deploy/systemd/nubo-goapi.service.in"),
      readProjectFile("deploy/systemd/nubo-web.service.in"),
    ])

    expect(goapi).toContain('Environment="NUBO_ENV_FILE=@NUBO_ENV_FILE@"')
    expect(goapi).toContain("WorkingDirectory=@NUBO_STATE_DIR@")
    expect(goapi).toContain("ReadWritePaths=@NUBO_UPLOAD_DIR@")
    expect(goapi).toContain("ExecStart=@NUBO_RELEASE_DIR@/bin/goapi")
    expect(web).toContain("@NODE_BINARY@ --env-file=@NUBO_ENV_FILE@")
    expect(web).toContain("@NUBO_RELEASE_DIR@/web/.output/server/index.mjs")
    expect(web).not.toContain("ReadWritePaths=")
    expect(goapi).toContain("ProtectSystem=strict")
    expect(web).toContain("ProtectSystem=strict")
  })

  it("serves the same configurable upload root through either proxy", async () => {
    const [nginx, caddy] = await Promise.all([
      readProjectFile("deploy/nginx/nubo.conf.in"),
      readProjectFile("deploy/caddy/Caddyfile.in"),
    ])

    expect(nginx).toContain("alias @NUBO_UPLOAD_DIR@/")
    expect(caddy).toContain("root * @NUBO_UPLOAD_DIR@")
    expect(nginx).toContain("proxy_pass http://127.0.0.1:3000")
    expect(caddy).toContain("reverse_proxy 127.0.0.1:3000")
  })
})
