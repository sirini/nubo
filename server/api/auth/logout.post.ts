import { deleteCookie } from "h3"
import { AUTH_KEY, REFRESH_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const cookieOptions = {
    httpOnly: true,
    path: "/",
  }

  const token = getCookie(event, AUTH_KEY)
  deleteCookie(event, AUTH_KEY, cookieOptions)
  deleteCookie(event, REFRESH_KEY, cookieOptions)

  return await $fetch("/auth/logout", {
    baseURL: config.apiBaseInternal,
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
})
