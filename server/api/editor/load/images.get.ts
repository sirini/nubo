import { AUTH_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_KEY)
  const q = getQuery(event) as { boardUid: number; lastUid: number; bunch: number }

  return await $fetch("/editor/load/images", {
    baseURL: config.apiBaseInternal,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    query: {
      boardUid: q.boardUid,
      lastUid: q.lastUid,
      bunch: q.bunch,
    },
  })
})
