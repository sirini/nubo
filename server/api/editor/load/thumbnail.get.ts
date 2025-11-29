export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const searchString = getRequestURL(event).search

  return proxyRequest(event, `${config.apiBaseInternal}/editor/load/thumbnail${searchString}`)
})
