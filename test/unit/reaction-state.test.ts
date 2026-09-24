import { describe, expect, it } from "vitest"
import { normalizeReactionState, reactionAfterTransition, REACTION_STATE } from "../../app/types/reaction"

describe("normalizeReactionState", () => {
  it("returns the zero state for missing or invalid payloads", () => {
    expect(normalizeReactionState(null)).toEqual(REACTION_STATE)
    expect(normalizeReactionState(undefined)).toEqual(REACTION_STATE)
    expect(normalizeReactionState({})).toEqual(REACTION_STATE)
    expect(normalizeReactionState({ reactions: { like: -3, best: Number.NaN } as never })).toEqual({
      reactions: { like: 0, best: 0, facepalm: 0, hmm: 0 },
      myReaction: null,
    })
  })

  it("keeps per-type counts and a valid myReaction from the new contract", () => {
    expect(
      normalizeReactionState({
        reactions: { like: 3, best: 2, facepalm: 0, hmm: 1 },
        myReaction: "best",
      }),
    ).toEqual({ reactions: { like: 3, best: 2, facepalm: 0, hmm: 1 }, myReaction: "best" })
  })

  it("rejects unknown reaction names", () => {
    expect(normalizeReactionState({ myReaction: "downvote" as never, reactions: { like: 1 } as never }).myReaction).toBeNull()
  })

  it("migrates legacy like/liked fields when reactions are missing", () => {
    expect(normalizeReactionState({ like: 5, liked: true })).toEqual({
      reactions: { like: 5, best: 0, facepalm: 0, hmm: 0 },
      myReaction: "like",
    })
    expect(normalizeReactionState({ like: 5, liked: false })).toEqual({
      reactions: { like: 5, best: 0, facepalm: 0, hmm: 0 },
      myReaction: null,
    })
    // 새 계약이 있으면 구 필드로 덮어쓰지 않는다
    expect(
      normalizeReactionState({ reactions: { like: 1, best: 0, facepalm: 0, hmm: 0 }, myReaction: null, like: 99, liked: true }),
    ).toEqual({ reactions: { like: 1, best: 0, facepalm: 0, hmm: 0 }, myReaction: null })
  })
})

describe("reactionAfterTransition", () => {
  it("moves the count from the previous reaction to the next one", () => {
    const state = { reactions: { like: 3, best: 2, facepalm: 0, hmm: 1 }, myReaction: "like" as const }
    expect(reactionAfterTransition(state, "best")).toEqual({
      reactions: { like: 2, best: 3, facepalm: 0, hmm: 1 },
      myReaction: "best",
    })
  })

  it("cancels the current reaction without going negative", () => {
    const state = { reactions: { like: 0, best: 1, facepalm: 0, hmm: 0 }, myReaction: "like" as const }
    expect(reactionAfterTransition(state, null)).toEqual({
      reactions: { like: 0, best: 1, facepalm: 0, hmm: 0 },
      myReaction: null,
    })
  })

  it("keeps the state unchanged when re-selecting the same reaction", () => {
    const state = { reactions: { like: 3, best: 0, facepalm: 0, hmm: 0 }, myReaction: "like" as const }
    expect(reactionAfterTransition(state, "like")).toBe(state)
  })
})
