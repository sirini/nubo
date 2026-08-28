import type { NuboHomeContext } from "./contexts/home"
import type { HomePostItem } from "~/types/home"
import { toast } from "vue-sonner"

export const useHomeProvider = (): NuboHomeContext => {
  const home = useHomeStore()
  const auth = useAuthStore()
  const { like } = useBoard()
  const { getBoardConfig } = useEditor()
  const route = useRoute()
  const boardUids = new Map<string, number>()
  const pendingLikes = new Set<string>()

  const toggleLike = async (post: HomePostItem) => {
    if (!auth.isLoggedIn) {
      await navigateTo({ path: "/auth/login", query: { redirect: route.fullPath } })
      return
    }

    const postKey = `${post.id}:${post.uid}`
    if (pendingLikes.has(postKey)) return
    pendingLikes.add(postKey)

    try {
      let boardUid = boardUids.get(post.id)
      if (!boardUid) {
        const config = await getBoardConfig(post.id)
        if (!config?.success || !config.result?.config.uid) {
          toast(`❌ 게시판 정보를 불러오지 못했습니다: ${config?.error || "알 수 없는 오류"}`)
          return
        }
        boardUid = config.result.config.uid
        boardUids.set(post.id, boardUid)
      }

      const liked = !post.liked
      const response = await like({ boardUid, postUid: post.uid, liked })
      if (!response?.success) {
        toast(`❌ 좋아요 상태를 변경하지 못했습니다: ${response?.error || "알 수 없는 오류"}`)
        return
      }

      post.liked = liked
      post.like = Math.max(0, post.like + (liked ? 1 : -1))
    } catch {
      toast("❌ 좋아요 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.")
    } finally {
      pendingLikes.delete(postKey)
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
    toggleLike,
    getPostsById: async (id: string, limit: number) => home.getInitLatestPostsById(id, limit),
  }
}
