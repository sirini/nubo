export const REACTIONS = ["like", "best", "facepalm", "hmm", "laugh", "celebrate", "fire", "support", "sad", "eyes"] as const

export type Reaction = (typeof REACTIONS)[number]

export type ReactionCounts = Record<Reaction, number>

export type ReactionState = {
  reactions: ReactionCounts
  myReaction: Reaction | null
}

export const REACTION_STATE: ReactionState = {
  reactions: { like: 0, best: 0, facepalm: 0, hmm: 0, laugh: 0, celebrate: 0, fire: 0, support: 0, sad: 0, eyes: 0 },
  myReaction: null,
}

export const REACTION_META: Record<Reaction, { icon: string; label: string }> = {
  like: { icon: "❤️", label: "좋아요" },
  best: { icon: "🙌", label: "최고" },
  facepalm: { icon: "🤦", label: "아차" },
  hmm: { icon: "🤔", label: "글쎄요" },
  laugh: { icon: "😂", label: "웃겨요" },
  celebrate: { icon: "🎉", label: "축하해요" },
  fire: { icon: "🔥", label: "멋져요" },
  support: { icon: "🫂", label: "응원해요" },
  sad: { icon: "😢", label: "슬퍼요" },
  eyes: { icon: "👀", label: "주목해요" },
}

// 구 GOAPI 응답(reactions 필드 없음)에서도 기존 like/liked를 이전해 표시가 0/null로 깨지지 않게 한다.
export const normalizeReactionState = (
  state: (Partial<ReactionState> & { like?: number; liked?: boolean }) | null | undefined,
): ReactionState => {
  const counts = state?.reactions
  const legacy = !counts
  let myReaction: Reaction | null =
    state?.myReaction && REACTIONS.includes(state.myReaction) ? state.myReaction : null
  if (legacy && myReaction === null && state?.liked === true) myReaction = "like"
  return {
    reactions: {
      like: Math.max(0, Number(legacy ? state?.like : counts?.like) || 0),
      best: Math.max(0, Number(counts?.best) || 0),
      facepalm: Math.max(0, Number(counts?.facepalm) || 0),
      hmm: Math.max(0, Number(counts?.hmm) || 0),
      laugh: Math.max(0, Number(counts?.laugh) || 0),
      celebrate: Math.max(0, Number(counts?.celebrate) || 0),
      fire: Math.max(0, Number(counts?.fire) || 0),
      support: Math.max(0, Number(counts?.support) || 0),
      sad: Math.max(0, Number(counts?.sad) || 0),
      eyes: Math.max(0, Number(counts?.eyes) || 0),
    },
    myReaction,
  }
}

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
