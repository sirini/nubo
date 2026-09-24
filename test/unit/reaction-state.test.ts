import { describe, expect, it } from "vitest"
import { normalizeReactionState, reactionAfterTransition, REACTION_STATE, REACTIONS } from "../../app/types/reaction"
import type { ReactionCounts } from "../../app/types/reaction"

const counts = (partial: Partial<ReactionCounts>): ReactionCounts => ({
  ...REACTIONS.reduce((acc, item) => ({ ...acc, [item]: 0 }), {} as ReactionCounts),
  ...partial,
})

describe("normalizeReactionState", () => {
  it("returns the zero state for missing or invalid payloads", () => {
    expect(normalizeReactionState(null)).toEqual(REACTION_STATE)
    expect(normalizeReactionState(undefined)).toEqual(REACTION_STATE)
    expect(normalizeReactionState({})).toEqual(REACTION_STATE)
    expect(normalizeReactionState({ reactions: { like: -3, best: Number.NaN } as never })).toEqual({
      reactions: counts({}),
      myReaction: null,
    })
  })

  it("keeps per-type counts and a valid myReaction from the new contract", () => {
    expect(
      normalizeReactionState({
        reactions: counts({ like: 3, best: 2, facepalm: 0, hmm: 1, laugh: 4, eyes: 2 }),
        myReaction: "best",
      }),
    ).toEqual({ reactions: counts({ like: 3, best: 2, hmm: 1, laugh: 4, eyes: 2 }), myReaction: "best" })
  })

  it("rejects unknown reaction names", () => {
    expect(normalizeReactionState({ myReaction: "downvote" as never, reactions: { like: 1 } as never }).myReaction).toBeNull()
  })

  it("migrates legacy like/liked fields when reactions are missing", () => {
    expect(normalizeReactionState({ like: 5, liked: true })).toEqual({
      reactions: counts({ like: 5 }),
      myReaction: "like",
    })
    expect(normalizeReactionState({ like: 5, liked: false })).toEqual({
      reactions: counts({ like: 5 }),
      myReaction: null,
    })
    // 새 계약이 있으면 구 필드로 덮어쓰지 않는다
    expect(
      normalizeReactionState({ reactions: counts({ like: 1 }), myReaction: null, like: 99, liked: true }),
    ).toEqual({ reactions: counts({ like: 1 }), myReaction: null })
  })

  it("treats missing extended kinds as zero for old payloads", () => {
    expect(
      normalizeReactionState({ reactions: { like: 2, best: 1, facepalm: 0, hmm: 0 } as never, myReaction: "like" }),
    ).toEqual({ reactions: counts({ like: 2, best: 1 }), myReaction: "like" })
  })
})

describe("reactionAfterTransition", () => {
  it("moves the count from the previous reaction to the next one", () => {
    const state = { reactions: counts({ like: 3, best: 2, hmm: 1 }), myReaction: "like" as const }
    expect(reactionAfterTransition(state, "laugh")).toEqual({
      reactions: counts({ like: 2, best: 2, hmm: 1, laugh: 1 }),
      myReaction: "laugh",
    })
  })

  it("cancels the current reaction without going negative", () => {
    const state = { reactions: counts({ best: 1 }), myReaction: "like" as const }
    expect(reactionAfterTransition(state, null)).toEqual({
      reactions: counts({ best: 1 }),
      myReaction: null,
    })
  })

  it("keeps the state unchanged when re-selecting the same reaction", () => {
    const state = { reactions: counts({ like: 3 }), myReaction: "like" as const }
    expect(reactionAfterTransition(state, "like")).toBe(state)
  })
})
