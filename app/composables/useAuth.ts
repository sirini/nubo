import { reqPost } from "~/composables/useUtils"
import type { Resp } from "~/types/common"
import type { UserInfoResult, UserMyResult } from "~/types/user"

export const useAuth = () => {
  const config = useRuntimeConfig()
  // 사용자 정보를 기존 토큰 정보로 가져와서 반환
  const loadInitUserInfo = async () => {
    const { data } = await useFetch<Resp<UserMyResult>>("/auth/load", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
    return resp(data.value)
  }

  // 다른 사용자의 공개된 정보를 가져와서 반환
  const loadInitOtherUserInfo = async (targetUserUid: number) => {
    const { data } = await useFetch<Resp<UserInfoResult>>("/auth/user/info", {
      baseURL: config.public.apiBase,
      method: "GET",
      params: {
        targetUserUid,
      },
    })
    return resp(data.value)
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
    loadInitOtherUserInfo,
    doLogin,
    doLogout,
    updateRefreshToken,
  }
}
