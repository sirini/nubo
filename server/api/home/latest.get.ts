export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const params = getQuery(event) as {
    sinceUid: number
    bunch: number
    option: string
    keyword: string
  }

  const res = await $fetch("/home/latest", {
    baseURL: config.apiBaseInternal,
    method: "GET",
    params,
  })

  return res
})
