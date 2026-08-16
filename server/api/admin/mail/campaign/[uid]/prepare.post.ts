import { safeProxyRequest } from "~~/server/utils/proxy"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const uid = getRouterParam(event, "uid")
  return safeProxyRequest(event, `${config.apiBaseInternal}/admin/mail/campaign/${uid}/prepare`)
})
