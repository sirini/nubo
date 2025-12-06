import { AUTH_KEY, type Resp } from "~/types/common"
import type { UserMyResult } from "~/types/user"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  try {
    const response = await $fetch<Resp<UserMyResult>>(`${config.apiBaseInternal}/auth/signin`, {
      method: "POST",
      body: body,
    })
    if (!response.success) {
      return response
    }

    const accessToken = response.result.token
    if (accessToken) {
      setCookie(event, AUTH_KEY, accessToken, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * parseInt(config.public.accessTokenHours),
      })
    }

    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.response?.status || 401,
      statusMessage: error.response?.statusText || "Login Failed",
      data: error.data,
    })
  }
})
