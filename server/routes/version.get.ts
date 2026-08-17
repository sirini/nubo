interface GoapiVersion {
  status: string
  service: string
  version: string
  apiContract: string
}

const API_CONTRACT_VERSION = "1"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  let goapi: GoapiVersion | { status: "unavailable" }
  try {
    goapi = await $fetch<GoapiVersion>(`${config.apiBaseInternal}/version`, {
      retry: 0,
      timeout: 2000,
    })
  }
  catch {
    goapi = { status: "unavailable" }
  }

  return {
    status: goapi.status === "ok" ? "ok" : "degraded",
    service: "nubo",
    version: config.public.version,
    apiContract: API_CONTRACT_VERSION,
    goapi,
  }
})
