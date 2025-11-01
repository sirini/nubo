import { SHA256 } from "crypto-js"
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
    const { $api } = useNuxtApp()
    const fd = new FormData()
    fd.append("id", id.trim())
    fd.append("password", SHA256(password).toString())

    return await $api<Resp<MyInfoResult>>("/auth/signin", {
      method: "POST",
      body: fd,
    })
  }

  // 로그아웃 처리하기
  const fetchLogout = async (token: string) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<null>>("/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  // 액세스 토큰 업데이트
  const fetchToken = async (userUid: number, refresh: string) => {
    const { $api } = useNuxtApp()
    const fd = new FormData()
    fd.append("userUid", userUid.toString())
    fd.append("refresh", refresh)

    return await $api<Resp<string>>("/auth/refresh", {
      method: "POST",
      body: fd,
    })
  }

  return {
    fetchUserInfo,
    fetchOAuthUserInfo,
    fetchLogin,
    fetchLogout,
    fetchToken,
  }
}
