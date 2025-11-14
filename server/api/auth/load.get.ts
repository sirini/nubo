export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const Authorization = getHeader(event, "Authorization") || ""

  return await $fetch("/auth/load", {
    baseURL: config.apiBaseInternal,
    method: "GET",
    headers: {
      Authorization,
    },
  })
})
