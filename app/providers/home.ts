import type { NuboHomeContext } from "./contexts/home"

export const useHomeProvider = (): NuboHomeContext => {
  const home = useHomeStore()

  return {
    isLoading: computed(() => home.isLoading),
    isLastPost: computed(() => home.isLastPost),
    posts: computed(() => home.posts),
    loadMorePosts: async () => {
      await home.loadMore()
    },
    getPostsById: async (id: string, limit: number) => home.getInitLatestPostsById(id, limit),
  }
}
