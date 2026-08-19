import { API_CONTRACT_VERSION, type GoapiVersion } from "./versionCompatibility"

type GoapiVersionFetcher = (url: string, options: { retry: number; timeout: number }) => Promise<GoapiVersion>

export type StartupContractCheck =
  | { status: "compatible"; expected: string; actual: string }
  | { status: "incompatible"; expected: string; actual: string }
  | { status: "unavailable"; expected: string }

export const checkStartupContract = async (
  apiBaseInternal: string,
  fetchVersion: GoapiVersionFetcher = (url, options) => $fetch<GoapiVersion>(url, options),
): Promise<StartupContractCheck> => {
  try {
    const goapi = await fetchVersion(`${apiBaseInternal}/version`, { retry: 0, timeout: 2000 })
    return {
      status: goapi.apiContract === API_CONTRACT_VERSION ? "compatible" : "incompatible",
      expected: API_CONTRACT_VERSION,
      actual: goapi.apiContract,
    }
  }
  catch {
    return { status: "unavailable", expected: API_CONTRACT_VERSION }
  }
}
