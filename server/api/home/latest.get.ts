export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const searchString = getRequestURL(event).search

  return proxyRequest(event, `${config.apiBaseInternal}/home/latest${searchString}`)
})
