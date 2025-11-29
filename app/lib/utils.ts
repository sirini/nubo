import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// for Tailwindcss
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 날짜만 출력하기
export function showDateOnly(timestamp: number, divider: string = "-"): string {
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = ("0" + (date.getMonth() + 1)).slice(-2)
  const d = ("0" + date.getDate()).slice(-2)
  return `${y}${divider}${m}${divider}${d}`
}

// 큰 숫자는 K, M 단위를 뒤에 붙여서 표현
export function showReadableNumber(big: number): string {
  if (big > 999999) {
    return (big / 1000000).toFixed(1) + "M"
  } else if (big > 999) {
    return (big / 1000).toFixed(1) + "K"
  } else {
    return big.toString()
  }
}

// HTML 태그 제거하기
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>?/gm, "")
}

// Composables에서 사용할 useAsyncData 래퍼 (GET)
export function useAsyncGet<T>(cacheKey: string, url: string, params: Record<string, any> = {}) {
  const { $api } = useNuxtApp()
  return useAsyncData<T>(cacheKey, () => $api<T>(url, { method: "GET", params }), {
    server: true,
  })
}

// Composables에서 사용할 래퍼
export function useApiAction<T>() {
  const { $api } = useNuxtApp()
  const loading = ref<boolean>(false)
  const error = ref<any>(null)

  type ApiBody = Record<string, any> | FormData

  const execute = async (
    url: string,
    options: {
      method: "POST" | "PUT" | "PATCH" | "DELETE"
      body: ApiBody
    },
  ) => {
    loading.value = true
    try {
      const result = await $api<T>(url, {
        method: "POST",
        body: options.body,
      })
      return result
    } catch (e) {
      console.error("Post Action Error: ", e)
      error.value = `url: ${url}, error: ${e}`
    } finally {
      loading.value = false
    }
  }

  const post = (url: string, body: ApiBody) => execute(url, { method: "POST", body })
  const put = (url: string, body: ApiBody) => execute(url, { method: "PUT", body })
  const patch = (url: string, body: ApiBody) => execute(url, { method: "PATCH", body })
  const remove = (url: string, body: ApiBody) => execute(url, { method: "DELETE", body })

  return {
    loading,
    error,

    post,
    put,
    patch,
    remove,
  }
}
