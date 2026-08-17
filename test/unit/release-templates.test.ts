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

  it("serves uploads and routes Nuxt and GOAPI through Nginx", async () => {
    const nginx = await readProjectFile("deploy/nginx/nubo.conf.in")

    expect(nginx).toContain("alias @NUBO_UPLOAD_DIR@/")
    expect(nginx).toContain("proxy_pass http://127.0.0.1:@NUBO_WEB_PORT@")
    expect(nginx).toContain("location /@NUBO_GOAPI_PATH@/")
    expect(nginx).toContain("proxy_pass http://127.0.0.1:@NUBO_GOAPI_PORT@")
    expect(nginx.match(/proxy_set_header X-Forwarded-Proto \$scheme/g)).toHaveLength(2)
  })
})
