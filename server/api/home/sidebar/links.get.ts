export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const res = await $fetch("/home/sidebar/links", {
    baseURL: config.apiBaseInternal,
    method: "GET",
  })

  return res
})
