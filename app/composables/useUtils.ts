import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// for Tailwindcss
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

// 날짜만 출력하기
export const date = (timestamp: number, divider: string = "-") => {
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = ("0" + (date.getMonth() + 1)).slice(-2)
  const d = ("0" + date.getDate()).slice(-2)
  return `${y}${divider}${m}${divider}${d}`
}

// 큰 숫자는 K, M 단위를 뒤에 붙여서 표현
export const num = (big: number) => {
  if (big > 999999) {
    return (big / 1000000).toFixed(1) + "M"
  } else if (big > 999) {
    return (big / 1000).toFixed(1) + "K"
  } else {
    return big.toString()
  }
}

// HTML 태그 제거하기
export const stripTags = (html: string) => {
  return html.replace(/<[^>]*>?/gm, "")
}

// Composables에서 사용할 클라이언트용 GET
export const reqGet = async <T>(url: string, query: Record<string, any>) => {
  const { $api } = useNuxtApp()
  return $api<T>(url, { method: "GET", query })
}

// Composables에서 사용할 클라이언트용 POST
export const reqPost = async <T>(url: string, body: Record<string, any> | BodyInit | FormData) => {
  const { $api } = useNuxtApp()
  return $api<T>(url, { method: "POST", body })
}

// Composables에서 사용할 클라이언트용 PATCH
export const reqPatch = async <T>(
  url: string,
  body: Record<string, any> | BodyInit | FormData,
  query: Record<string, any> = {},
) => {
  const { $api } = useNuxtApp()
  return $api<T>(url, { method: "PATCH", body, query })
}

// Composables에서 사용할 클라이언트용 DELETE
export const reqDelete = async <T>(url: string, query: Record<string, any>) => {
  const { $api } = useNuxtApp()
  return $api<T>(url, { method: "DELETE" })
}
