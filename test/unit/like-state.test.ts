import { describe, expect, it } from "vitest"
import { likeCountAfterTransition } from "../../app/utils/like"

describe("like count state transitions", () => {
  it("increments and decrements only when the liked state changes", () => {
    expect(likeCountAfterTransition(3, false, true)).toBe(4)
    expect(likeCountAfterTransition(3, true, false)).toBe(2)
    expect(likeCountAfterTransition(3, false, false)).toBe(3)
    expect(likeCountAfterTransition(3, true, true)).toBe(3)
  })

  it("never exposes a negative count", () => {
    expect(likeCountAfterTransition(0, true, false)).toBe(0)
  })
})
