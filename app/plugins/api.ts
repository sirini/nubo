export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const apiFetch = $fetch.create({
    baseURL: config.public.apiBase,
    
    onRequest({ options }) {
      if (import.meta.server) {
        const headers = useRequestHeaders(['cookie'])
        options.headers = {
          ...options.headers,
          ...headers
        }
      }
    },
    
    onResponseError({ response }) {
      if (response.status === 401) {
        if (import.meta.client) {
          navigateTo('/auth/login')
        }
      }
    }
  })

  return {
    provide: {
      api: apiFetch
    }
  }
})