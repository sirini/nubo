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
      expect.arrayContaining([
        "nubo-basic-board",
        "nubo-basic-blog",
        "nubo-advance-blog",
        "nubo-basic-gallery",
        "nubo-advance-gallery",
      ]),
    )
  })

  it("registers the advance home as an independent home skin", () => {
    const { installed } = useSkins()

    expect(installed.value).toContainEqual(
      expect.objectContaining({ type: "home", key: "nubo-advance-home" }),
    )
    expect(resolveSkinComponentPath("nubo-advance-home", "Home")).toMatch(
      /\/skins\/nubo-advance-home\/Home\.vue$/,
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

  it("keeps the advance gallery independent for every gallery route", () => {
    for (const entry of ["GalleryList", "GalleryView", "GalleryWrite", "GalleryModify"]) {
      expect(resolveSkinComponentPath("nubo-advance-gallery", entry, "DefaultList")).toMatch(
        new RegExp(`/skins/nubo-advance-gallery/${entry}\\.vue$`),
      )
    }
  })

  it("keeps the advance blog independent for every blog route", () => {
    for (const entry of ["BlogList", "BlogView", "BlogWrite", "BlogModify"]) {
      expect(resolveSkinComponentPath("nubo-advance-blog", entry, "DefaultList")).toMatch(
        new RegExp(`/skins/nubo-advance-blog/${entry}\\.vue$`),
      )
    }
  })
})
