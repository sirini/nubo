import { readFileSync, readdirSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()
const source = (path: string) => readFileSync(resolve(root, path), "utf8")

const vueFilesUnder = (path: string): string[] =>
  readdirSync(path).flatMap((entry) => {
    const target = resolve(path, entry)
    return statSync(target).isDirectory()
      ? vueFilesUnder(target)
      : target.endsWith(".vue")
        ? [target]
        : []
  })

describe("shared NUBO editor contract", () => {
  it("keeps Tiptap implementation out of skin packages", () => {
    for (const file of vueFilesUnder(resolve(root, "app/skins"))) {
      const content = readFileSync(file, "utf8")
      expect(content).not.toContain("@tiptap/")
      expect(content).not.toContain("useTiptapEditor(")
    }
  })

  it("uses the platform editor in every built-in post editor", () => {
    const editors = [
      "app/skins/nubo-basic-board/DefaultWrite.vue",
      "app/skins/nubo-basic-board/DefaultModify.vue",
      "app/skins/nubo-basic-blog/BlogWrite.vue",
      "app/skins/nubo-basic-blog/BlogModify.vue",
      "app/skins/nubo-basic-gallery/GalleryWrite.vue",
      "app/skins/nubo-basic-gallery/GalleryModify.vue",
      "app/skins/nubo-basic-trade/components/TradeEditor.vue",
      "app/skins/nubo-advance-blog/components/AdvanceBlogEditor.vue",
      "app/skins/nubo-advance-gallery/components/AdvanceGalleryEditor.vue",
    ]

    for (const file of editors) {
      expect(source(file)).toContain('~/components/editor/NuboTiptapEditor.vue')
      expect(source(file)).toContain("<NuboTiptapEditor")
    }
  })

  it("exposes table editing through the shared post toolbar", () => {
    const editor = source("app/components/editor/NuboTiptapEditor.vue")
    const tableMenu = source("app/components/editor/NuboEditorTableMenu.vue")
    expect(editor).toContain("<NuboEditorTableMenu")
    expect(tableMenu).toContain("insertTable")
    expect(tableMenu).toContain("addRowAfter")
    expect(tableMenu).toContain("addColumnAfter")
  })
})
