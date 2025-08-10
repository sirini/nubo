export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // 클라이언트에서 사용할 API 인스턴스 정의
  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onResponseError(ctx) {
      const status = ctx.response?.status
      const statusText = ctx.response?.statusText
      console.error("API Error:", status, statusText, ctx.response?._data)
    },
  })

  return {
    provide: { api },
  }
})
