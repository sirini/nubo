import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const readProfile = (path: string) =>
  readFileSync(resolve(process.cwd(), "app/skins/nubo-advance-profile", path), "utf8")

describe("advance profile studio contracts", () => {
  it("exposes the studio only on the authenticated user's own profile", () => {
    const profile = readProfile("Profile.vue")
    const studio = readProfile("components/AdvanceProfileStudio.vue")

    expect(profile).toContain('v-if="isMe" value="studio"')
    expect(studio).toContain("loadMyStudio")
    expect(studio).toContain("if (!isMe.value || !boardId.value) return")
    expect(studio).not.toContain("targetUserUid")
    expect(studio).not.toContain("userUid")
  })

  it("uses the board-scoped API contract without deriving private image paths", () => {
    const studio = readProfile("components/AdvanceProfileStudio.vue")

    for (const sort of ["recent", "views", "likes", "comments"]) {
      expect(studio).toContain(`value: "${sort}"`)
    }
    expect(studio).toContain("id: boardId.value")
    expect(studio).toContain(':src="post.cover"')
    expect(studio).not.toContain("getPreviewImage")
    expect(studio).toContain("STATUS.SECRET")
  })

  it("keeps public activity and conversation capabilities", () => {
    const profile = readProfile("Profile.vue")

    expect(profile).toContain("AdvanceProfileActivity")
    expect(profile).toContain("AdvanceProfileConversation")
    expect(profile).toContain("AdvanceProfileReportDialog")
  })
})
