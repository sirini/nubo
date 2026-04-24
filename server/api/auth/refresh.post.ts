import { AUTH_KEY, type Resp } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const cookie = getHeader(event, "cookie") || ""

  try {
    const response = await $fetch<Resp<string>>(`${config.apiBaseInternal}/auth/refresh`, {
      method: "POST",
      body,
      headers: {
        cookie,
      },
    })
    if (!response.success) {
      return response
    }

    const accessToken = response.result
    if (accessToken) {
      setCookie(event, AUTH_KEY, accessToken, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * parseInt(config.public.auth.accessTokenHours),
      })
    }

    return response
  } catch (error: any) {
    throw createError({
      status: error.response?.status || 401,
      statusText: error.response?.statusText || "Refreshing access token failed",
      data: error.data,
    })
  }
})
