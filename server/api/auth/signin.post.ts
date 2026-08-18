import { AUTH_KEY, REFRESH_KEY, type Resp } from "~/types/common"
import type { UserMyResult } from "~/types/user"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const response = await $fetch<Resp<UserMyResult>>("/auth/signin", {
    baseURL: config.apiBaseInternal,
    method: "POST",
    body,
  })
  if (!response.success) {
    return response
  }

  const accessToken = response.result.token
  const refreshToken = response.result.refresh

  if (accessToken) {
    setCookie(event, AUTH_KEY, accessToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * parseInt(config.public.accessHours),
    })
  }

  if (refreshToken) {
    setCookie(event, REFRESH_KEY, refreshToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * parseInt(config.public.refreshDays),
    })
  }

  return response
})
