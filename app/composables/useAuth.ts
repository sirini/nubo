import { reqPost } from "~/composables/useUtils"
import { type Resp } from "~/types/common"
import type { UserMyResult } from "~/types/user"

export const useAuth = () => {
  const config = useRuntimeConfig()
  // 사용자 정보를 기존 토큰 정보로 가져와서 반환
  const loadInitUserInfo = async () => {
    return await useFetch<Resp<UserMyResult>>("/auth/load", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
  }

  // 로그인 처리하기
  const doLogin = async (id: string, password: string) => {
    return await reqPost<Resp<UserMyResult>>("/auth/signin", { id, password })
  }

  // 로그아웃 처리하기
  const doLogout = async () => {
    return await reqPost<Resp<null>>("/auth/logout", {})
  }

  // 액세스 토큰 업데이트
  const updateRefreshToken = async (userUid: number) => {
    return await reqPost<Resp<null>>("/auth/refresh", { userUid })
  }

  return {
    loadInitUserInfo,
    doLogin,
    doLogout,
    updateRefreshToken,
  }
}
