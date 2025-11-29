import { useAsyncGet } from "~/lib/utils"
import type { Resp } from "~/types/common"
import type { HomePostItem, HomeLatestPostsParams, HomeSidebarGroupResult } from "~/types/home"

export const useHome = () => {
  const today = new Date().toISOString().slice(0, 10)

  // 방문 기록 추가하기
  const addVisitHistory = async (userUid?: number) => {
    if (import.meta.server) return // 서버에서는 실행 금지

    const { $api } = useNuxtApp()
    const flag = "nuboIsVisitToday"

    try {
      if (localStorage.getItem(flag) === today) return

      await $api("/home/visit", {
        method: "GET",
        params: { userUid },
      })
    } catch (e) {
      console.error("Failed to add a visiting count:", e)
    } finally {
      localStorage.setItem(flag, today)
    }
  }

  // 홈 화면 메뉴 가져오기
  const fetchHomeMenus = async () => {
    return useAsyncGet<Resp<HomeSidebarGroupResult[]>>("home-munus", "/home/sidebar/links")
  }

  // 홈 화면에서 게시글들 목록 조회하기
  const fetchHomeLatestPosts = async (params: HomeLatestPostsParams) => {
    return useAsyncGet<Resp<HomePostItem[]>>(
      `home-latest-${params.sinceUid}-${params.option}-${params.keyword}`,
      "/home/latest",
      params,
    )
  }

  return {
    addVisitHistory,
    fetchHomeMenus,
    fetchHomeLatestPosts,
  }
}
