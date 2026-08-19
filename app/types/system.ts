export interface RuntimeBuildComponent {
  version: string
  commit: string
  dirty: boolean
}

export interface RuntimeVersionStatus {
  status: "ok" | "degraded"
  service: "nubo"
  version: string
  apiContract: string
  build: null | {
    releaseVersion: string
    apiContract: string
    components: {
      nubo: RuntimeBuildComponent
      goapi: RuntimeBuildComponent
    }
  }
  issues: string[]
  goapi:
    | { status: "unavailable" }
    | { status: "ok"; service: string; version: string; apiContract: string }
}
