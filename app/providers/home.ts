import type { NuboHomeContext } from "./contexts/home"
import type { HomePostItem } from "~/types/home"
import { normalizeReactionState, type Reaction } from "~/types/reaction"
import { toast } from "vue-sonner"

export const useHomeProvider = (): NuboHomeContext => {
  const home = useHomeStore()
  const auth = useAuthStore()
  const { reaction } = useBoard()
  const { getBoardConfig } = useEditor()
  const route = useRoute()
  const boardUids = new Map<string, number>()
  const pendingReactions = new Set<string>()

  const resolveBoardUid = async (post: HomePostItem) => {
    let boardUid = boardUids.get(post.id)
    if (boardUid) return boardUid
    const config = await getBoardConfig(post.id)
    if (!config?.success || !config.result?.config.uid) {
      toast(`❌ 게시판 정보를 불러오지 못했습니다: ${config?.error || "알 수 없는 오류"}`)
      return 0
    }
    boardUid = config.result.config.uid
    boardUids.set(post.id, boardUid)
    return boardUid
  }

  // 홈 카드에서도 네 종류를 선택·취소하고 서버가 돌려준 최신 요약으로 상태를 갱신한다.
  const setPostReaction = async (post: HomePostItem, next: Reaction | null) => {
    if (!auth.isLoggedIn) {
      await navigateTo({ path: "/auth/login", query: { redirect: route.fullPath } })
      return
    }
    const postKey = `${post.id}:${post.uid}`
    if (pendingReactions.has(postKey) || post.myReaction === next) return
    pendingReactions.add(postKey)

    try {
      const boardUid = await resolveBoardUid(post)
      if (!boardUid) return
      const response = await reaction({
        boardUid,
        postUid: post.uid,
        reaction: next,
      })
      if (!response?.success || !response.result) {
        toast(`❌ 리액션 상태를 변경하지 못했습니다: ${response?.error || "알 수 없는 오류"}`)
        return
      }
      const state = normalizeReactionState(response.result)
      post.reactions = state.reactions
      post.myReaction = state.myReaction
      post.liked = state.myReaction === "like"
      post.like = state.reactions.like
    } catch {
      toast("❌ 리액션 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.")
    } finally {
      pendingReactions.delete(postKey)
    }
  }

  return {
    isLoggedIn: computed(() => auth.isLoggedIn),
    isLanding: computed({
      get: () => home.isLanding,
      set: (val: boolean) => (home.isLanding = val),
    }),
    isLastPost: computed(() => home.isLastPost),
    menus: computed(() => home.menus),
    posts: computed(() => home.posts),
    option: computed(() => home.option),
    optionLabels: computed(() => home.optionLabels),
    keyword: computed(() => home.keyword),
    loadMorePosts: async () => {
      await home.loadMore()
    },
    reloadPosts: async () => {
      home.isLastPost = false
      await home.getInitLatestPosts({ reset: true })
    },
    setPostReaction,
    getPostsById: async (id: string, limit: number) => home.getInitLatestPostsById(id, limit),
  }
}
