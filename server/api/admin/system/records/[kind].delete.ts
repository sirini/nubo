import { safeProxyRequest } from "~~/server/utils/proxy"
export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")
  const kind = getRouterParam(event, "kind")
  if (kind !== "visits" && kind !== "audit") throw createError({ statusCode: 400 })
  return safeProxyRequest(event, `${useRuntimeConfig().apiBaseInternal}/admin/system/records/${kind}`)
})
