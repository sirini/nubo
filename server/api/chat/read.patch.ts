import { safeProxyRequest } from "~~/server/utils/proxy"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  return safeProxyRequest(event, `${config.apiBaseInternal}/chat/read`)
})
