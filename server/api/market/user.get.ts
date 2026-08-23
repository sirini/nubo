import type { Resp } from "~/types/common"
import type { UserMyResult } from "~/types/user"
import { safeProxyRequest } from "~~/server/utils/proxy"

type MarketUser = Pick<UserMyResult, "uid" | "name" | "admin">

export default defineEventHandler(async (event): Promise<Resp<MarketUser | null>> => {
  const config = useRuntimeConfig()
  const response = await safeProxyRequest(event, `${config.apiBaseInternal}/auth/load`) as Resp<UserMyResult | null>

  if (!response?.success || !response.result) {
    return { ...response, result: null }
  }

  const { uid, name, admin } = response.result
  return { ...response, result: { uid, name, admin } }
})
