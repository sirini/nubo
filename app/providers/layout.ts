import { toast } from "vue-sonner"
import { SEARCH, type Search } from "~/types/board"
import type { NuboLayoutContext } from "./contexts/layout"

export const useLayoutProvider = (): NuboLayoutContext => {
  const router = useRouter()
  const auth = useAuthStore()
  const home = useHomeStore()

  return {
    isAdmin: computed(() => auth.isAdmin),
    isLoggedIn: computed(() => auth.isLoggedIn),
    user: computed(() => auth.user),
    menus: computed(() => home.menus),
    searchOptions: computed(() => [
      { label: "제목", value: SEARCH.TITLE },
      { label: "내용", value: SEARCH.CONTENT },
      { label: "작성자", value: SEARCH.WRITER },
      { label: "태그", value: SEARCH.TAG },
      { label: "이미지", value: SEARCH.IMAGEDESC },
    ]),
    searchOption: computed({ get: () => home.option, set: (val: Search) => (home.option = val) }),
    searchKeyword: computed({
      get: () => home.keyword,
      set: (val: string) => (home.keyword = val),
    }),
    notifications: computed(() => home.notifications),
    search: (event: Event) => {
      event.preventDefault()
      if (home.keyword.length < 2) {
        toast("검색어는 2글자 이상 입력해주세요!")
        return
      }
      router.push(`/search/${home.optionLabels[home.option]}/${encodeURIComponent(home.keyword)}`)
    },
    moveTop: () => {
      if (import.meta.client) {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    },
    loadNotifications: async (limit: number) => {
      await home.loadNoti(limit)
    },
  }
}
