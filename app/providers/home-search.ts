import type { NuboHomeContext } from "~/types/nubo-skin-keys"

export const useHomeSearchProvider = (): NuboHomeContext => {
  const home = useHomeStore()

  return {
    isLoading: computed(() => home.isLoading),
    posts: computed(() => home.posts),
    loadMorePosts: async () => {
      await home.loadMore()
    },
  }
}
