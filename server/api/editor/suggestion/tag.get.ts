import { AUTH_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_KEY)
  const query = getQuery(event) as { tag: string; limit: number }

  return await $fetch("/editor/suggestion/tag", {
    baseURL: config.apiBaseInternal,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    query,
  })
})
