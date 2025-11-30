import type { Resp } from "~/types/common"
import type { UserMyResult } from "~/types/user"

export const useAuth = () => {
  // 사용자 정보를 기존 토큰 정보로 가져와서 반환
  const loadInitUserInfo = async () => {
    const { $api } = useNuxtApp()
    const headers = useRequestHeaders(["cookie"])
    return await $api<Resp<UserMyResult>>("/auth/load", {
      method: "GET",
      headers, // 쿠키를 GOAPI 서버로 전달 (SSR)
    })
  }

  // 로그인 처리하기
  const doLogin = async (id: string, password: string) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<UserMyResult>>("/auth/signin", {
      method: "POST",
      body: { id, password },
    })
  }

  // 로그아웃 처리하기
  const doLogout = async () => {
    const { $api } = useNuxtApp()
    return await $api<Resp<null>>("/auth/logout", {
      method: "POST",
    })
  }

  // 액세스 토큰 업데이트
  const updateRefreshToken = async (userUid: number) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<null>>("/auth/refresh", {
      method: "POST",
      body: { userUid },
    })
  }

  return {
    loadInitUserInfo,
    doLogin,
    doLogout,
    updateRefreshToken,
  }
}
