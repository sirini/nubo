import { defineStore } from "pinia"
import { toast } from "vue-sonner"
import { BOARD_CONFIG, SEARCH, type Search } from "~/types/board"
import {
  HomeSearchOptions,
  type NotificationItem,
  type HomePostItem,
  type HomePostResult,
  type HomeSidebarGroupResult,
} from "~/types/home"

export const useHomeStore = defineStore("home", () => {
  const {
    loadInitPosts,
    loadInitPostsById,
    loadMorePosts,
    loadInitHomeMenus,
    loadMyNotifications,
  } = useHome()
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
  const isLastPost = ref<boolean>(false)
  const isLanding = ref<boolean>(true)
  const posts = ref<HomePostItem[]>([])
  const sinceUid = ref<number>(0)
  const notifications = ref<NotificationItem[]>([])

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

  // (검색된 or 전체) 게시글들 가져오기
  const getInitLatestPosts = async (opts?: { reset?: boolean }) => {
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

    if (!response || !response.success || !response.result) {
      toast(`❌ 서버로부터 데이터를 가져오지 못했습니다: ${response?.error}`)
      return
    }

    mergePosts(response.result ?? [])
    initialized.value = true
  }

  // 지정된 게시판 ID로 게시글들 가져오기
  const getInitLatestPostsById = async (id: string, limit: number): Promise<HomePostResult> => {
    const result: HomePostResult = { items: [], config: BOARD_CONFIG }
    const response = await loadInitPostsById(id, limit)

    if (!response || !response.success || !response.result) {
      toast(`❌ 서버로부터 데이터를 가져오지 못했습니다: ${response?.error}`)
      return result
    }
    return response.result
  }

  // 초기 페이지 로드 시 상단 메뉴들 가져오기
  const getInitMenus = async () => {
    const response = await loadInitHomeMenus()
    if (!response || !response.success || !response.result) {
      console.error(`❌ Failed to initialize the menu links`)
      return
    }
    menus.value = response.result
  }

  // (검색된 or 전체) 이전 게시글 더 가져오기
  const loadMore = async () => {
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
    if (!response || !response.success) {
      toast(`❌ 이전 게시글을 가져오지 못했습니다: ${response?.error}`)
      return
    }
    mergePosts(response.result)
    toast(`✅ 이전 게시글들을 가져왔습니다`)
  }

  // 나에게 온 알림 목록 가져오기
  const loadNoti = async (limit: number) => {
    const response = await loadMyNotifications(limit)
    if (!response || !response.success) {
      toast(`❌ 알림 목록을 불러오지 못했습니다: ${response?.error}`)
      return
    }
    notifications.value = response.result
  }

  // 각종 변수 초기화
  const reset = () => {
    sinceUid.value = 0
    posts.value = []
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
    isLanding,
    isLastPost,
    posts,
    sinceUid,
    notifications,

    getInitLatestPosts,
    getInitLatestPostsById,
    getInitMenus,
    loadMore,
    loadNoti,
    reset,
  }
})
