import { AUTH_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_KEY)
  const searchString = getRequestURL(event).search

  return proxyRequest(event, `${config.apiBaseInternal}/admin/group/list/remove${searchString}`, {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
})
