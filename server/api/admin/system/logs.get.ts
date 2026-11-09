import { safeProxyRequest } from "~~/server/utils/proxy"

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")
  const config = useRuntimeConfig()
  return safeProxyRequest(event, `${config.apiBaseInternal}/admin/system/logs`)
})
