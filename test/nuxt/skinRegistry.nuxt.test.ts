import { describe, expect, it } from "vitest"
import { resolveSkinComponentPath, useSkins } from "../../app/composables/useSkins"

describe("built-in skin registry", () => {
  it("loads every configured default from a valid manifest", () => {
    const { defaults, installed, manifestIssues } = useSkins()

    expect(manifestIssues.value).toEqual([])
    for (const [type, key] of Object.entries(defaults)) {
      expect(installed.value).toContainEqual(expect.objectContaining({ type, key }))
    }
  })

  it("registers board, blog, and gallery as separate board skins", () => {
    const { installed } = useSkins()
    const boardKeys = installed.value
      .filter((skin) => skin.type === "board")
      .map((skin) => skin.key)

    expect(boardKeys).toEqual(
      expect.arrayContaining(["nubo-basic-board", "nubo-basic-blog", "nubo-basic-gallery"]),
    )
  })

  it("keeps legacy basic-board selections on their matching blog and gallery UI", () => {
    expect(resolveSkinComponentPath("nubo-basic-board", "BlogList", "DefaultList")).toMatch(
      /\/skins\/nubo-basic-blog\/BlogList\.vue$/,
    )
    expect(resolveSkinComponentPath("nubo-basic-board", "GalleryView", "DefaultView")).toMatch(
      /\/skins\/nubo-basic-gallery\/GalleryView\.vue$/,
    )
    expect(resolveSkinComponentPath("nubo-basic-board", "DefaultList", "DefaultList")).toMatch(
      /\/skins\/nubo-basic-board\/DefaultList\.vue$/,
    )
  })
})
