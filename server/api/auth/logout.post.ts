import { deleteCookie } from "h3"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const Authorization = getHeader(event, "Authorization") || ""
  const cookieOptions = {
    httpOnly: true,
    path: "/",
  }

  deleteCookie(event, "nubo-oauth-access", cookieOptions)
  deleteCookie(event, "nubo-oauth-refresh", cookieOptions)
  deleteCookie(event, "auth-token", cookieOptions)
  deleteCookie(event, "auth-refresh", cookieOptions)

  return await $fetch("/auth/logout", {
    baseURL: config.apiBaseInternal,
    method: "POST",
    headers: {
      Authorization,
    },
  })
})
