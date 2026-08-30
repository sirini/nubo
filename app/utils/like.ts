export const likeCountAfterTransition = (
  count: number,
  previouslyLiked: boolean,
  nextLiked: boolean,
) => {
  if (previouslyLiked === nextLiked) return Math.max(0, count)
  return Math.max(0, count + (nextLiked ? 1 : -1))
}
