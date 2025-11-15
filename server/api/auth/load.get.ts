export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, "nubo-auth-token")

  return await $fetch("/auth/load", {
    baseURL: config.apiBaseInternal,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
})
