import { describe, expect, it } from "vitest"
import { createBoardEditInitialValues } from "../../app/skins/nubo-basic-admin/components/boardFormValues"
import { BOARD_CONFIG } from "../../app/types/board"

describe("admin board edit form", () => {
  it("keeps the board's persisted group when opened through a direct management link", () => {
    const values = createBoardEditInitialValues({
      ...BOARD_CONFIG,
      uid: 23,
      id: "photos",
      groupUid: 17,
    })

    expect(values).toMatchObject({ boardUid: 23, id: "photos", groupUid: 17 })
  })
})
