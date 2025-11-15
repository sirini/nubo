import { deleteCookie } from "h3"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const cookieOptions = {
    httpOnly: true,
    path: "/",
  }

  const token = getCookie(event, "nubo-auth-token")
  deleteCookie(event, "nubo-auth-token", cookieOptions)
  deleteCookie(event, "nubo-auth-refresh", cookieOptions)

  return await $fetch("/auth/logout", {
    baseURL: config.apiBaseInternal,
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
})
