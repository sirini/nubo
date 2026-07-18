import { safeProxyRequest } from "~~/server/utils/proxy"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const searchString = getRequestURL(event).search

  return safeProxyRequest(event, `${config.apiBaseInternal}/admin/board/remove${searchString}`)
})
