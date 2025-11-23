import { AUTH_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_KEY)

  return proxyRequest(event, `${config.apiBaseInternal}/auth/user/info`, {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
})
