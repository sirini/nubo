export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const result = await checkStartupContract(config.apiBaseInternal)
  if (result.status === "compatible") return

  console.warn(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "warn",
    service: "nubo",
    event: result.status === "incompatible"
      ? "goapi_contract_mismatch"
      : "goapi_contract_check_unavailable",
    expected_api_contract: result.expected,
    ...(result.status === "incompatible" ? { actual_api_contract: result.actual } : {}),
  }))
})
