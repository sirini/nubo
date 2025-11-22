import { AUTH_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_KEY)
  const query = getQuery(event) as { title: string; limit: number }

  return await $fetch("/editor/suggestion/title", {
    baseURL: config.apiBaseInternal,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    query,
  })
})
