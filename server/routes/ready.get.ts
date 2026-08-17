export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  try {
    await $fetch(`${config.apiBaseInternal}/ready`, {
      retry: 0,
      timeout: 2000,
    })
    return {
      status: "ok",
      service: "nubo",
      dependencies: { goapi: "ok" },
    }
  }
  catch {
    setResponseStatus(event, 503)
    return {
      status: "unavailable",
      service: "nubo",
      dependencies: { goapi: "unavailable" },
    }
  }
})
