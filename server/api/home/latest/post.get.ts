export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  return proxyRequest(event, `${config.apiBaseInternal}/home/latest/post`)
})
