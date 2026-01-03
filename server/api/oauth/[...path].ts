export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = getRouterParam(event, "path")
  const targetUrl = `${config.apiBaseInternal}/auth/${path}`
  return proxyRequest(event, targetUrl)
})
