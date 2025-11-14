import { SHA256 } from "crypto-js"
import { usePostAction } from "~/lib/utils"
import type { Resp } from "~/types/common"
import type { MyInfoResult } from "~/types/user"

export const useAuth = () => {
  // 사용자 정보를 기존 토큰 정보로 가져와서 반환
  const fetchUserInfo = async (token: string) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<MyInfoResult>>("/auth/load", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "GET",
    })
  }

  // OAuth 로그인 이후 결과값 반환
  const fetchOAuthUserInfo = async () => {
    const { $api } = useNuxtApp()
    return await $api<Resp<MyInfoResult>>("/auth/oauth/userinfo", {
      method: "GET",
    })
  }

  // 로그인 처리하기
  const fetchLogin = async (id: string, password: string) => {
    const { execute } = usePostAction<Resp<MyInfoResult>>()
    const body = new FormData()
    body.append("id", id.trim())
    body.append("password", SHA256(password).toString())

    return await execute("/auth/signin", body)
  }

  // 로그아웃 처리하기
  const fetchLogout = async (token: string) => {
    const { execute } = usePostAction<Resp<null>>()

    return await execute(
      "/auth/logout",
      {},
      {
        Authorization: `Bearer ${token}`,
      },
    )
  }

  // 액세스 토큰 업데이트
  const fetchToken = async (userUid: number, refresh: string) => {
    const { execute } = usePostAction<Resp<string>>()
    const body = new FormData()
    body.append("userUid", userUid.toString())
    body.append("refresh", refresh)

    return await execute("/auth/refresh", body)
  }

  return {
    fetchUserInfo,
    fetchOAuthUserInfo,
    fetchLogin,
    fetchLogout,
    fetchToken,
  }
}
