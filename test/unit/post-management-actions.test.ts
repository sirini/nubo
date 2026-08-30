import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

describe("built-in post management actions", () => {
  it("shows the shared delete action only to the writer or a board administrator", () => {
    const action = source("app/components/board/view/BoardPostDeleteButton.vue")

    expect(action).toContain('v-if="isWriter || isAdmin"')
    expect(action).toContain('@click="confirmRemovePost(view.post.uid)"')
    expect(action).toContain('@confirm="remove(view.config.uid, view.post.uid)"')
    expect(action).toContain('variant="destructive"')
  })

  it("provides the shared delete action in every skin that previously omitted it", () => {
    for (const path of [
      "app/skins/nubo-advance-gallery/components/AdvanceGalleryDetails.vue",
      "app/skins/nubo-advance-blog/BlogView.vue",
      "app/skins/nubo-basic-blog/BlogView.vue",
    ]) {
      const view = source(path)
      expect(view, path).toContain("<BoardPostDeleteButton />")
      expect(view, path).toContain('~/components/board/view/BoardPostDeleteButton.vue')
    }
  })

  it("keeps writer and administrator deletion in the existing basic action menus", () => {
    for (const skin of ["nubo-basic-board", "nubo-basic-gallery", "nubo-basic-trade"]) {
      const path = `app/skins/${skin}/components/view/ViewActionButton.vue`
      const action = source(path)

      expect(action, path).toContain(':disabled="!isWriter && !isAdmin"')
      expect(action, path).toContain('@click="confirmRemovePost(view.post.uid)"')
      expect(action, path).toContain('@confirm="remove(view.config.uid, view.post.uid)"')
    }
  })

  it("allows an administrator to enter the basic blog edit route", () => {
    const modify = source("app/skins/nubo-basic-blog/components/view/ViewModifyButton.vue")

    expect(modify).toContain('v-if="isWriter || isAdmin"')
    expect(modify).toContain("/${view.post.uid}/edit`")
  })

  it("uses the protected board deletion endpoint", () => {
    const boardApi = source("app/composables/useBoard.ts")

    expect(boardApi).toContain('return await $fetch<Resp<null>>("/board/remove/post"')
    expect(boardApi).toContain('method: "DELETE"')
  })
})
