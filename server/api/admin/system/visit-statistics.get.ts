import { safeProxyRequest } from "~~/server/utils/proxy"
export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")
  return safeProxyRequest(event, `${useRuntimeConfig().apiBaseInternal}/admin/system/visit-statistics`)
})
