import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const readSkin = (path: string) =>
  readFileSync(resolve(process.cwd(), "app/skins/nubo-advance-home", path), "utf8")

describe("advance home skin UX contracts", () => {
  it("keeps the feed independent and exposes community actions", () => {
    const home = readSkin("Home.vue")
    const card = readSkin("components/AdvanceHomeFeedCard.vue")
    const rail = readSkin("components/AdvanceHomeRail.vue")

    expect(home).not.toContain("~/skins/")
    expect(home).toContain("loadMorePosts")
    expect(home).toContain("reloadPosts")
    expect(card).toContain("toggle-like")
    expect(card).toContain("open-media")
    expect(rail).toContain("menus")
  })

  it("provides a keyboard-accessible full-screen media viewer", () => {
    const viewer = readSkin("components/AdvanceHomeMediaViewer.vue")

    expect(viewer).toContain('<Teleport to="body">')
    expect(viewer).toContain("fixed inset-0 z-[100]")
    expect(viewer).toContain("getPreviewImage")
    expect(viewer).toContain('event.key === "Escape"')
    expect(viewer).toContain('event.key === "ArrowLeft"')
    expect(viewer).toContain('event.key === "ArrowRight"')
    expect(viewer).toContain("fitToScreen")
    expect(viewer).toContain("returnFocus")
  })
})
