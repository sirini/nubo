export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, "id")
  const searchString = getRequestURL(event).search
  return proxyRequest(event, `${config.apiBaseInternal}/home/latest/${id}${searchString}`)
})
