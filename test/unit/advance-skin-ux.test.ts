import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const skinSource = (skin: "blog" | "gallery") =>
  readFileSync(resolve(process.cwd(), `app/skins/nubo-advance-${skin}/${skin === "blog" ? "Blog" : "Gallery"}View.vue`), "utf8")

describe("advance skin UX contracts", () => {
  it("uses the actual edit route in both view skins", () => {
    for (const source of [skinSource("blog"), skinSource("gallery")]) {
      expect(source).toContain("/${view.post.uid}/edit`")
      expect(source).not.toContain("/${view.post.uid}/modify`")
    }
  })

  it("anchors the blog reading progress to the viewport", () => {
    const source = skinSource("blog")

    expect(source).toContain('<Teleport to="body">')
    expect(source).toContain("fixed inset-x-0 top-0")
  })

  it("keeps gallery navigation clicks out of the preview zoom target", () => {
    const source = skinSource("gallery")

    expect(source).toContain("pointer-events-auto size-12")
    expect(source).toContain('@click.stop="previous(false)"')
    expect(source).toContain('@click.stop="next(false)"')
  })

  it("provides a scrollable and draggable 1:1 image canvas", () => {
    const source = skinSource("gallery")

    expect(source).toContain('ref="viewerViewport"')
    expect(source).toContain('@pointerdown="startPan"')
    expect(source).toContain("viewport.scrollLeft = panStart.left - dx")
    expect(source).toContain("centerOriginal()")
  })
})
