import type { ReleaseManifestSummary } from "./releaseManifest"
import apiContract from "../../deploy/api-contract.json"

export const API_CONTRACT_VERSION = apiContract.version

export interface GoapiVersion {
  status: string
  service: string
  version: string
  apiContract: string
}

export type VersionIssue =
  | "release_manifest_unavailable"
  | "nubo_version_mismatch"
  | "goapi_unavailable"
  | "goapi_version_mismatch"
  | "api_contract_mismatch"

export const versionIssues = (
  nuboVersion: string,
  goapi: GoapiVersion | null,
  manifest: ReleaseManifestSummary | null,
): VersionIssue[] => {
  const issues: VersionIssue[] = []
  if (!manifest) issues.push("release_manifest_unavailable")
  else {
    if (manifest.releaseVersion !== nuboVersion || manifest.components.nubo.version !== nuboVersion) {
      issues.push("nubo_version_mismatch")
    }
    if (manifest.apiContract !== API_CONTRACT_VERSION) issues.push("api_contract_mismatch")
  }

  if (!goapi || goapi.status !== "ok") issues.push("goapi_unavailable")
  else {
    if (manifest && manifest.components.goapi.version !== goapi.version) issues.push("goapi_version_mismatch")
    if (goapi.apiContract !== API_CONTRACT_VERSION && !issues.includes("api_contract_mismatch")) {
      issues.push("api_contract_mismatch")
    }
  }
  return issues
}
