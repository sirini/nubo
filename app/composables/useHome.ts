import { reqGet } from "~/composables/useUtils"
import { IS_VISITED, type Resp } from "~/types/common"
import type { HomePostItem, HomeLatestPostsParams, HomeSidebarGroupResult } from "~/types/home"

export const useHome = () => {
  const config = useRuntimeConfig()
  const today = new Date().toISOString().slice(0, 10)

  // 방문 기록 추가하기
  const addVisitHistory = async (userUid?: number) => {
    if (import.meta.server) return // 서버에서는 실행 금지
    try {
      if (localStorage.getItem(IS_VISITED) === today) return
      await reqGet<Resp<null>>("/home/visit", { userUid })
    } catch (e) {
      console.error("Failed to add a visiting count:", e)
    } finally {
      localStorage.setItem(IS_VISITED, today)
    }
  }

  // 홈 화면 메뉴 가져오기
  const loadInitHomeMenus = async () => {
    return await useFetch<Resp<HomeSidebarGroupResult[]>>("/home/sidebar/links", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
  }

  // 홈 화면에서 게시글들 목록 조회하기
  const loadInitPosts = async (params: HomeLatestPostsParams) => {
    return useFetch<Resp<HomePostItem[]>>("/home/latest", {
      baseURL: config.public.apiBase,
      method: "GET",
      params,
    })
  }

  // 홈 화면에서 이전 게시글들을 더 가져오기
  const loadMorePosts = async (params: HomeLatestPostsParams) => {
    return reqGet<Resp<HomePostItem[]>>("/home/latest", params)
  }

  return {
    addVisitHistory,
    loadInitHomeMenus,
    loadInitPosts,
    loadMorePosts,
  }
}
