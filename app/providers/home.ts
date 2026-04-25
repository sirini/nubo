import type { NuboHomeContext } from "./contexts/home"

export const useHomeProvider = (): NuboHomeContext => {
  const home = useHomeStore()

  return {
    isLanding: computed({
      get: () => home.isLanding,
      set: (val: boolean) => (home.isLanding = val),
    }),
    isLastPost: computed(() => home.isLastPost),
    posts: computed(() => home.posts),
    option: computed(() => home.option),
    optionLabels: computed(() => home.optionLabels),
    keyword: computed(() => home.keyword),
    loadMorePosts: async () => {
      await home.loadMore()
    },
    getPostsById: async (id: string, limit: number) => home.getInitLatestPostsById(id, limit),
  }
}
