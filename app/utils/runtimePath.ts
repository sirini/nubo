export const normalizeAppBaseURL = (value: string | undefined): string => {
  const input = value?.trim() || "/"
  if (!input.startsWith("/") || input.startsWith("//") || /[?#]/.test(input)) {
    throw new Error(`app baseURL은 /로 시작하는 경로여야 합니다: ${input}`)
  }
  const segments = input.split("/").filter(Boolean)
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error(`app baseURL에 상대 경로 구간을 사용할 수 없습니다: ${input}`)
  }
  return segments.length ? `/${segments.join("/")}/` : "/"
}

export const resolvePublicApiBase = (appBaseURL: string, configured = ""): string => {
  const explicit = configured.trim()
  if (explicit) return explicit === "/" ? "/" : explicit.replace(/\/+$/, "")
  return `${normalizeAppBaseURL(appBaseURL)}api`
}

export const joinRuntimePath = (baseURL: string, path: string): string =>
  `${baseURL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
