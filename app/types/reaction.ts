export const REACTIONS = ["like", "best", "facepalm", "hmm"] as const

export type Reaction = (typeof REACTIONS)[number]

export type ReactionCounts = Record<Reaction, number>

export type ReactionState = {
  reactions: ReactionCounts
  myReaction: Reaction | null
}

export const REACTION_STATE: ReactionState = {
  reactions: { like: 0, best: 0, facepalm: 0, hmm: 0 },
  myReaction: null,
}

export const REACTION_META: Record<Reaction, { icon: string; label: string }> = {
  like: { icon: "❤️", label: "좋아요" },
  best: { icon: "🙌", label: "최고" },
  facepalm: { icon: "🤦", label: "아차" },
  hmm: { icon: "🤔", label: "글쎄요" },
}

export const normalizeReactionState = (state: Partial<ReactionState> | null | undefined): ReactionState => ({
  reactions: {
    like: Math.max(0, Number(state?.reactions?.like) || 0),
    best: Math.max(0, Number(state?.reactions?.best) || 0),
    facepalm: Math.max(0, Number(state?.reactions?.facepalm) || 0),
    hmm: Math.max(0, Number(state?.reactions?.hmm) || 0),
  },
  myReaction: state?.myReaction && REACTIONS.includes(state.myReaction) ? state.myReaction : null,
})

export const reactionAfterTransition = (
  state: ReactionState,
  next: Reaction | null,
): ReactionState => {
  if (state.myReaction === next) return state
  const reactions = { ...state.reactions }
  if (state.myReaction) reactions[state.myReaction] = Math.max(0, reactions[state.myReaction] - 1)
  if (next) reactions[next] += 1
  return { reactions, myReaction: next }
}
