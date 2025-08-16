import type { Resp } from "~/types/common"
import type { HomeSidebarGroupResult } from "~/types/home"

export async function useHomeMenus() {
  const { $api } = useNuxtApp()

  // 출력되는 기본값 정의
  const defaultResp: Resp<HomeSidebarGroupResult[]> = {
    success: false,
    error: "init value",
    code: 0,
    result: [],
  }

  // SSR 포함 최초 로드
  const { data, pending, error, refresh, execute } = await useAsyncData(
    "home-menus",
    () => $api<Resp<HomeSidebarGroupResult[]>>("/home/sidebar/links", { method: "GET" }),
    {
      server: true,
      immediate: true,
      default: () => defaultResp,
    },
  )

  return {
    menus: data.value,
    pending,
    error,
    refresh,
    execute,
  }
}
