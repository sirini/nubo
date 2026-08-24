import { resolvePublicApiBase } from "~/utils/runtimePath"

// 같은 prebuilt를 하위 경로에 실행해도 브라우저 API가 현재 Nuxt baseURL을 따라가게 합니다.
export default defineNuxtPlugin({
  name: "nubo-runtime-paths",
  enforce: "pre",
  setup() {
    const config = useRuntimeConfig()
    config.public.apiBase = resolvePublicApiBase(config.app.baseURL, config.public.apiBase)
  },
})
