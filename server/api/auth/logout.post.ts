import { deleteCookie, getCookie } from "h3"
import { AUTH_KEY, REFRESH_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { reqPost } = useApi()
  const token = getCookie(event, AUTH_KEY)

  try {
    if (token) {
      await $fetch("/auth/logout", {
        baseURL: config.apiBaseInternal,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    }
  } catch (error) {
    console.error("Backend logout failed:", error)
  }

  const cookieOptions = {
    httpOnly: true,
    path: "/",
  }

  deleteCookie(event, AUTH_KEY, cookieOptions)
  deleteCookie(event, REFRESH_KEY, cookieOptions)

  return {
    success: true,
    error: "",
    result: null,
  }
})
