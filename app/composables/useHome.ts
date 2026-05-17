import { IS_VISITED, type Resp } from "~/types/common"
import type {
  HomeLatestPostsParams,
  HomePostItem,
  HomePostResult,
  HomeSidebarGroupResult,
  NotificationItem,
} from "~/types/home"

export const useHome = () => {
  const today = new Date().toISOString().slice(0, 10)
  const config = useRuntimeConfig()

  // 방문 기록 추가하기
  const addVisitHistory = async (userUid?: number) => {
    if (import.meta.server) return // 서버에서는 실행 금지
    try {
      if (localStorage.getItem(IS_VISITED) === today) return

      await useFetch<Resp<null>>("/home/visit", {
        baseURL: config.public.apiBase,
        method: "GET",
        query: { userUid },
      })
    } catch (e) {
      console.error("Failed to add a visiting count:", e)
    } finally {
      localStorage.setItem(IS_VISITED, today)
    }
  }

  // 홈 화면 메뉴 가져오기
  const loadInitHomeMenus = async () => {
    const { data } = await useFetch<Resp<HomeSidebarGroupResult[]>>("/home/sidebar/links", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
    return data.value
  }

  // 홈 화면에서 (검색된 or 전체) 게시글들 목록 조회하기
  const loadInitPosts = async (param: HomeLatestPostsParams) => {
    const { data } = await useFetch<Resp<HomePostItem[]>>("/home/latest", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
    return data.value
  }

  // 홈 화면에서 게시판 ID로 게시글들을 조회하기
  const loadInitPostsById = async (id: string, limit: number) => {
    const { data } = await useFetch<Resp<HomePostResult>>(`/home/latest/${id}`, {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { limit },
    })
    return data.value
  }

  // 홈 화면에서 이전 게시글들을 더 가져오기
  const loadMorePosts = async (param: HomeLatestPostsParams) => {
    const { data } = await useFetch<Resp<HomePostItem[]>>("/home/latest", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
    return data.value
  }

  // 홈 화면에서 나에게 온 알림 목록들 가져오기
  const loadMyNotifications = async (limit: number) => {
    const { data } = await useFetch<Resp<NotificationItem[]>>("/home/noti/load", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: {
        limit,
      },
    })
    return data.value
  }

  return {
    addVisitHistory,
    loadInitHomeMenus,
    loadInitPosts,
    loadInitPostsById,
    loadMorePosts,
    loadMyNotifications,
  }
}
