import { AUTH_KEY } from "~/types/common"
import { safeProxyRequest } from "~~/server/utils/proxy"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_KEY)

  return safeProxyRequest(event, `${config.apiBaseInternal}/auth/update`)
})
