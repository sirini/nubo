import type { NuboHomeContext } from "~/types/nubo-skin-keys"

export const useHomeProvider = (): NuboHomeContext => {
  const home = useHomeStore()

  return {
    pending: computed(() => home.pending),
    posts: computed(() => home.posts),
    loadMorePosts: async () => {
      await home.loadMore()
    },
  }
}
