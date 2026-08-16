export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  return safeProxyRequest(event, `${config.apiBaseInternal}/admin/mail/deliveries${getRequestURL(event).search}`)
})
