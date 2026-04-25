import type { BoardViewResult } from "~/types/board"
import { AUTH_KEY, type Resp } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const latestLimit = parseInt(query.latestLimit as string)
  const id = query.id as string
  const postUid = parseInt(query.postUid as string)
  const needUpdateHit = query.needUpdateHit === "true" ? 1 : 0
  const token = getCookie(event, AUTH_KEY)

  const response = await $fetch<Resp<BoardViewResult>>("/board/view", {
    baseURL: config.apiBaseInternal,
    method: "GET",
    query: {
      id,
      postUid,
      needUpdateHit,
      latestLimit,
    },
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  return response
})
