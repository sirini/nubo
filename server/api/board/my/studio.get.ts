import type { Resp } from "~/types/common"
import type { BoardStudioResult } from "~/types/board"
import { safeProxyRequest } from "~~/server/utils/proxy"

export default defineEventHandler(async (event): Promise<Resp<BoardStudioResult>> => {
  const config = useRuntimeConfig()

  return await safeProxyRequest(
    event,
    `${config.apiBaseInternal}/board/my/studio`,
  ) as Resp<BoardStudioResult>
})
