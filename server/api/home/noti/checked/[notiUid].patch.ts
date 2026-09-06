import { safeProxyRequest } from "~~/server/utils/proxy"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const notiUid = getRouterParam(event, "notiUid")
  return safeProxyRequest(event, `${config.apiBaseInternal}/home/noti/checked/${notiUid}`)
})
