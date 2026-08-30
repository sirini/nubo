import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

describe("현재 NUBO CLI 안내", () => {
  it("관리자 화면은 ./bin/nubo와 Source Mode 경계를 안내한다", () => {
    const skin = source("app/skins/nubo-basic-admin/Skin.vue")
    const dashboard = source("app/skins/nubo-basic-admin/Dashboard.vue")
    const manifest = JSON.parse(source("app/skins/nubo-basic-admin/skin.json"))

    expect(skin).toContain("./bin/nubo search gallery")
    expect(skin).toContain("./bin/nubo install skins/nubo-awesome-board")
    expect(skin).toContain("npm run typecheck")
    expect(skin).toContain("Web 프로세스를 다시 시작")
    expect(skin).not.toContain("nuboctl")
    expect(dashboard).toContain("./bin/nubo download --dry-run")
    expect(dashboard).toContain("빌드나 재시작을 자동으로 수행하지 않습니다")
    expect(dashboard).not.toContain("nuboctl")
    expect(manifest).toMatchObject({ version: "0.1.3", min_nubo_version: "1.3.1" })
  })

  it("README의 Market 절차도 수동 빌드와 재시작 경계를 유지한다", () => {
    const readme = source("README.md")

    expect(readme).toContain("./bin/nubo install skins/nubo-advance-gallery")
    expect(readme).toContain("npm run typecheck")
    expect(readme).toContain("스킨 삭제, Git 변경, Web 빌드와 프로세스 재시작을 대신하지 않습니다")
    expect(readme).not.toContain("nuboctl")
  })
})
