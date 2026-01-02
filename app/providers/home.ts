import type { NuboHomeContext } from "~/types/nubo-skin-keys"

export const useHomeProvider = (): NuboHomeContext => {
  const home = useHomeStore()

  return {
    isLoading: computed(() => home.isLoading),
    isLastPost: computed(() => home.isLastPost),
    posts: computed(() => home.posts),
    loadMorePosts: async () => {
      await home.loadMore()
    },
  }
}
