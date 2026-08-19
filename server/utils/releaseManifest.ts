import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

export interface ReleaseComponent {
  version: string
  commit: string
  dirty: boolean
}

export interface ReleaseManifestSummary {
  releaseVersion: string
  apiContract: string
  components: {
    nubo: ReleaseComponent
    goapi: ReleaseComponent
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const parseComponent = (value: unknown): ReleaseComponent | null => {
  if (!isRecord(value)) return null
  if (typeof value.version !== "string" || typeof value.commit !== "string" || typeof value.dirty !== "boolean") {
    return null
  }
  return { version: value.version, commit: value.commit, dirty: value.dirty }
}

export const parseReleaseManifest = (value: unknown): ReleaseManifestSummary | null => {
  if (!isRecord(value) || !isRecord(value.components)) return null
  const nubo = parseComponent(value.components.nubo)
  const goapi = parseComponent(value.components.goapi)
  if (typeof value.releaseVersion !== "string" || typeof value.apiContract !== "string" || !nubo || !goapi) {
    return null
  }
  return { releaseVersion: value.releaseVersion, apiContract: value.apiContract, components: { nubo, goapi } }
}

// 공식 release의 web 작업 경로와 독립 prebuilt 실행 경로를 모두 지원한다.
export const releaseManifestCandidates = () => {
  const configured = process.env.NUBO_RELEASE_MANIFEST?.trim()
  return [configured, resolve(process.cwd(), "../manifest.json"), resolve(process.cwd(), "manifest.json")]
    .filter((path): path is string => Boolean(path))
}

export const loadReleaseManifest = async (): Promise<ReleaseManifestSummary | null> => {
  for (const path of releaseManifestCandidates()) {
    try {
      const manifest = parseReleaseManifest(JSON.parse(await readFile(path, "utf8")))
      if (manifest) return manifest
    }
    catch {
      // 다음 표준 위치를 확인하고 모두 실패하면 진단 응답에서 unavailable로 표시한다.
    }
  }
  return null
}
