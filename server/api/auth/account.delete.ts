import { deleteCookie } from "h3"
import { safeProxyRequest } from "~~/server/utils/proxy"
import { AUTH_KEY, REFRESH_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const response = await safeProxyRequest(event, `${config.apiBaseInternal}/auth/account`)

  if (response && typeof response === "object" && "success" in response && response.success) {
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    }
    deleteCookie(event, AUTH_KEY, cookieOptions)
    deleteCookie(event, REFRESH_KEY, cookieOptions)
  }

  return response
})
