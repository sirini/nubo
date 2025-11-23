import { useApiAction } from "~/lib/utils"
import type { Resp } from "~/types/common"
import type { MyInfoResult } from "~/types/user"

export const useAuth = () => {
  // 사용자 정보를 기존 토큰 정보로 가져와서 반환
  const fetchUserInfo = async () => {
    const { $api } = useNuxtApp()
    const headers = useRequestHeaders(["cookie"])
    return await $api<Resp<MyInfoResult>>("/auth/load", {
      method: "GET",
      headers, // 쿠키를 GOAPI 서버로 전달 (SSR)
    })
  }

  // 로그인 처리하기
  const fetchLogin = async (id: string, password: string) => {
    const { post } = useApiAction<Resp<MyInfoResult>>()
    return await post("/auth/signin", { id, password })
  }

  // 로그아웃 처리하기
  const fetchLogout = async () => {
    const { post } = useApiAction<Resp<null>>()
    return await post("/auth/logout", {})
  }

  // 액세스 토큰 업데이트
  const fetchToken = async (userUid: number) => {
    const { post } = useApiAction<Resp<string>>()
    return await post("/auth/refresh", { userUid })
  }

  return {
    fetchUserInfo,
    fetchLogin,
    fetchLogout,
    fetchToken,
  }
}
