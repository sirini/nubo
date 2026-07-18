import { safeProxyRequest } from "~~/server/utils/proxy"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, "id")
  const searchString = getRequestURL(event).search

  return safeProxyRequest(event, `${config.apiBaseInternal}/home/latest/${id}${searchString}`)
})
