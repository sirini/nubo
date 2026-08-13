import { safeProxyRequest } from "~~/server/utils/proxy"

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  return safeProxyRequest(event, `${config.apiBaseInternal}/admin/report/resolve`)
})
