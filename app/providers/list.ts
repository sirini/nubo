import type { Search } from "~/types/board"
import type { NuboListContext } from "./contexts/list"

export const useListProvider = (): NuboListContext => {
  const board = useBoardStore()
  const auth = useAuthStore()

  return {
    notices: computed(() =>
      board.list.notices.filter((post) => !board.list.blackList.includes(post.writer.uid)),
    ),
    posts: computed(() =>
      board.list.posts.filter((post) => !board.list.blackList.includes(post.writer.uid)),
    ),
    userBlackList: computed(() => board.list.blackList),
    config: computed(() => board.list.config),
    isAdmin: computed(() => board.list.isAdmin),
    isLoggedIn: computed(() => auth.isLoggedIn),
    page: computed(() => board.page),
    totalPostCount: computed(() => board.list.totalPostCount),
    option: computed({ get: () => board.option, set: (val: Search) => (board.option = val) }),
    keyword: computed({ get: () => board.keyword, set: (val: string) => (board.keyword = val) }),
    searchPost: () => board.searchPost(),
    setPagingUrl: (targetPage: number) => board.setPagingUrl(targetPage),
  }
}
