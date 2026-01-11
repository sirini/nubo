import { defineStore } from "pinia"
import { toast } from "vue-sonner"
import { SEARCH, type Search } from "~/types/board"
import { HomeSearchOptions, type HomePostItem, type HomeSidebarGroupResult } from "~/types/home"

export const useHomeStore = defineStore("home", () => {
  const { loadInitPosts, loadMorePosts, loadInitHomeMenus } = useHome()
  const bunch = ref<number>(20)
  const error = ref<unknown>(null)
  const initialized = ref<boolean>(false)
  const keyword = ref<string>("")
  const menus = ref<HomeSidebarGroupResult[]>([])
  const option = ref<Search>(SEARCH.TITLE as Search)
  const options = ref<Record<string, number>>(HomeSearchOptions)
  const optionLabels = computed(() => {
    const labels: Record<number, string> = {}
    for (const [key, value] of Object.entries(options.value)) {
      labels[value] = key
    }
    return labels
  })
  const isLoading = ref<boolean>(false)
  const isLastPost = ref<boolean>(false)
  const posts = ref<HomePostItem[]>([])
  const sinceUid = ref<number>(0)

  // 내부 유틸: 결과 병합
  const mergePosts = (incoming: HomePostItem[] = []) => {
    if (sinceUid.value === 0) {
      posts.value = incoming
      return
    }
    const map = new Map<number, HomePostItem>(posts.value.map((i) => [i.uid, i]))
    for (const it of incoming) {
      map.set(it.uid, it)
    }
    const merged = Array.from(map.values())
    if (merged.length === posts.value.length && merged.at(-1)?.uid === posts.value.at(-1)?.uid) {
      return
    }
    posts.value = merged
  }

  // 목록 조회 (초기/검색/더보기 공용)
  const getInitLatestPosts = async (opts?: { reset?: boolean }) => {
    if (isLoading.value) return
    try {
      isLoading.value = true
      if (opts?.reset) {
        sinceUid.value = 0
        posts.value = []
      }

      const response = await loadInitPosts({
        sinceUid: sinceUid.value,
        bunch: bunch.value,
        option: option.value,
        keyword: keyword.value,
      })

      if (!response.success || !response.result) {
        toast(`❌ 서버로부터 데이터를 가져오지 못했습니다: ${response.error}`)
        return
      }

      mergePosts(response.result ?? [])
      initialized.value = true
    } finally {
      isLoading.value = false
    }
  }

  // 초기 페이지 로드 시 상단 메뉴들 가져오기
  const getInitMenus = async () => {
    const response = await loadInitHomeMenus()
    if (!response.success || !response.result) {
      console.error(`❌ Failed to initialize the menu links`)
      return
    }
    menus.value = response.result
  }

  // 이전 게시글 더 가져오기
  const loadMore = async () => {
    if (isLoading.value) return
    try {
      isLoading.value = true
      const last = posts.value.at(-1)?.uid ?? 0
      if (last === sinceUid.value) {
        isLastPost.value = true
        return
      }
      sinceUid.value = last

      const response = await loadMorePosts({
        sinceUid: sinceUid.value,
        bunch: bunch.value,
        option: option.value,
        keyword: keyword.value,
      })
      if (!response.success) {
        toast(`❌ 이전 게시글을 가져오지 못했습니다: ${response.error}`)
        return
      }
      mergePosts(response.result)
      toast(`✅ 이전 게시글들을 가져왔습니다`)
    } finally {
      isLoading.value = false
    }
  }

  // 각종 변수 초기화
  const reset = () => {
    sinceUid.value = 0
    posts.value = []
    isLoading.value = false
    error.value = null
    initialized.value = false
  }

  return {
    bunch,
    error,
    initialized,
    keyword,
    menus,
    option,
    options,
    optionLabels,
    isLoading,
    isLastPost,
    posts,
    sinceUid,

    getInitLatestPosts,
    getInitMenus,
    loadMore,
    reset,
  }
})
