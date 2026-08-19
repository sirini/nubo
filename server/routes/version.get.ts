export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const manifest = await loadReleaseManifest()
  let goapi: GoapiVersion | null
  try {
    goapi = await $fetch<GoapiVersion>(`${config.apiBaseInternal}/version`, {
      retry: 0,
      timeout: 2000,
    })
  }
  catch {
    goapi = null
  }

  const issues = versionIssues(config.public.version, goapi, manifest)

  return {
    status: issues.length === 0 ? "ok" : "degraded",
    service: "nubo",
    version: config.public.version,
    apiContract: API_CONTRACT_VERSION,
    build: manifest,
    issues,
    goapi: goapi ?? { status: "unavailable" },
  }
})
