const knownProviders = ["Resend", "Apple", "Google", "Firebase", "OpenAI", "Naver", "Kakao"]

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")
  const config = useRuntimeConfig()
  try {
    const status = await $fetch<Record<string, unknown>>(`${config.apiBaseInternal}/privacy/status`, { timeout: 2500 })
    if (!Array.isArray(status.providers) || typeof status.imageDescriptionEnabled !== "boolean") {
      throw new Error("Unsupported privacy status")
    }
    // Whitelist facts; never proxy arbitrary backend fields into this public response.
    return {
      available: true,
      providers: status.providers.filter((value): value is string => typeof value === "string" && knownProviders.includes(value)),
      auditLogRetentionDays: typeof status.auditLogRetentionDays === "number" ? status.auditLogRetentionDays : 0,
      imageDescriptionEnabled: status.imageDescriptionEnabled,
      securityLogEnabled: status.securityLogEnabled === true,
      securityLogRetentionDays: typeof status.securityLogRetentionDays === "number" ? status.securityLogRetentionDays : 0,
      securityLogMaskedIP: status.securityLogMaskedIP === true,
    }
  } catch {
    // An old or unreachable backend must not be reported as having no external processing.
    return { available: false, auditLogRetentionDays: 0, providers: [], imageDescriptionEnabled: null, securityLogEnabled: null, securityLogRetentionDays: 0, securityLogMaskedIP: null }
  }
})
