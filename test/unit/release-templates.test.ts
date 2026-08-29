import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

// 릴리스 템플릿 테스트가 저장소 기준 경로에서 파일을 읽도록 합니다.
const readProjectFile = (path: string) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8")

describe("v1.2 Linux 릴리스 보존 템플릿", () => {
  it("서비스 경로를 렌더링할 수 있고 웹 프로세스는 읽기 전용이다", async () => {
    const [goapi, web] = await Promise.all([
      readProjectFile("deploy/systemd/nubo-goapi.service.in"),
      readProjectFile("deploy/systemd/nubo-web.service.in"),
    ])

    expect(goapi).toContain('Environment="NUBO_ENV_FILE=@NUBO_ENV_FILE@"')
    expect(goapi).toContain("WorkingDirectory=@NUBO_STATE_DIR@")
    expect(goapi).toContain("ReadWritePaths=@NUBO_UPLOAD_DIR@")
    expect(goapi).toContain("UMask=0022")
    expect(goapi).toContain("ExecStart=@NUBO_RELEASE_DIR@/bin/goapi")
    expect(web).toContain("@NODE_BINARY@ --env-file=@NUBO_ENV_FILE@")
    expect(web).toContain("@NUBO_RELEASE_DIR@/web/.output/server/index.mjs")
    expect(web).not.toContain("ReadWritePaths=")
    expect(goapi).toContain("ProtectSystem=strict")
    expect(web).toContain("ProtectSystem=strict")
  })

  it("Nginx가 업로드를 제공하고 Nuxt와 GOAPI 요청을 구분한다", async () => {
    const nginx = await readProjectFile("deploy/nginx/nubo.conf.in")

    expect(nginx).toContain("alias @NUBO_UPLOAD_DIR@/")
    expect(nginx).toContain("proxy_pass http://127.0.0.1:@NUBO_WEB_PORT@")
    expect(nginx).toContain("location /@NUBO_GOAPI_PATH@/")
    expect(nginx).toContain("proxy_pass http://127.0.0.1:@NUBO_GOAPI_PORT@")
    expect(nginx.match(/proxy_set_header X-Forwarded-Proto \$scheme/g)).toHaveLength(2)
  })

  it("AI Source Mode 계약이 비밀값과 lifecycle을 CLI 경계 밖에 둔다", async () => {
    const guide = await readProjectFile("INSTALL_GUIDE_FOR_AI.md")

    expect(guide).toContain("./bin/nubo download --dry-run --plain")
    expect(guide).toContain("./bin/nubo download --yes --plain")
    expect(guide).toContain("chmod 0600 .env")
    expect(guide).toContain("DB migration, npm build 또는 프로세스 재시작")
    expect(guide).not.toContain("--env-input")
    expect(guide).not.toContain("systemctl restart nubo")
  })
})
