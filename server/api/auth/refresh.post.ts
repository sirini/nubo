import { AUTH_KEY, type Resp } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const cookie = getHeader(event, "cookie") || ""

  try {
    const backendResponse = await $fetch.raw<Resp<string>>("/auth/refresh", {
      baseURL: config.apiBaseInternal,
      method: "POST",
      body,
      headers: {
        cookie,
      },
    })
    const setCookies = backendResponse.headers.getSetCookie()
    for (const setCookie of setCookies) {
      appendHeader(event, "set-cookie", setCookie)
    }

    const response = backendResponse._data
    if (!response) {
      throw createError({ statusCode: 502, statusMessage: "Empty refresh response" })
    }
    if (!response.success) {
      return response
    }

    const accessToken = response.result
    if (accessToken) {
      setCookie(event, AUTH_KEY, accessToken, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * parseInt(config.public.auth.accessTokenHours),
      })
    }

    return response
  } catch (error: unknown) {
    const fetchError = error as {
      response?: { status?: number; statusText?: string }
      data?: unknown
    }
    throw createError({
      status: fetchError.response?.status || 401,
      statusText: fetchError.response?.statusText || "Refreshing access token failed",
      data: fetchError.data,
    })
  }
})
