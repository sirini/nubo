export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const uid = getRouterParam(event, "uid")
  return proxyRequest(event, `${config.apiBaseInternal}/admin/user/invite/${uid}`)
})
