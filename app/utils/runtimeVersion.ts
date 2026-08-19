const compatibilityMessages: Record<string, string> = {
  nubo_version_mismatch: "실행 중인 NUBO Web 버전이 릴리스 manifest와 다릅니다.",
  goapi_version_mismatch: "실행 중인 GOAPI 버전이 릴리스 manifest와 다릅니다.",
  api_contract_mismatch: "NUBO Web과 GOAPI의 API contract가 일치하지 않습니다.",
}

export const versionCompatibilityMessages = (issues: string[]) =>
  issues.flatMap((issue) => compatibilityMessages[issue] ? [compatibilityMessages[issue]] : [])
