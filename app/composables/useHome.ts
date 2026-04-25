import { IS_VISITED, type Resp } from "~/types/common"
import type {
  HomeLatestPostsParams,
  HomePostItem,
  HomePostResult,
  HomeSidebarGroupResult,
} from "~/types/home"

export const useHome = () => {
  const today = new Date().toISOString().slice(0, 10)
  const config = useRuntimeConfig()

  // 방문 기록 추가하기
  const addVisitHistory = async (userUid?: number) => {
    if (import.meta.server) return // 서버에서는 실행 금지
    try {
      if (localStorage.getItem(IS_VISITED) === today) return

      await $fetch<Resp<null>>("/home/visit", {
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
    return await $fetch<Resp<HomeSidebarGroupResult[]>>("/home/sidebar/links", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
  }

  // 홈 화면에서 (검색된 or 전체) 게시글들 목록 조회하기
  const loadInitPosts = async (param: HomeLatestPostsParams) => {
    return await $fetch<Resp<HomePostItem[]>>("/home/latest", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
  }

  // 홈 화면에서 게시판 ID로 게시글들을 조회하기
  const loadInitPostsById = async (id: string, limit: number) => {
    return await $fetch<Resp<HomePostResult>>(`/home/latest/${id}`, {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { limit },
    })
  }

  // 홈 화면에서 이전 게시글들을 더 가져오기
  const loadMorePosts = async (param: HomeLatestPostsParams) => {
    return await $fetch<Resp<HomePostItem[]>>("/home/latest", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
  }

  return {
    addVisitHistory,
    loadInitHomeMenus,
    loadInitPosts,
    loadInitPostsById,
    loadMorePosts,
  }
}
