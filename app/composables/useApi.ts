export const useApi = () => {
  const { $api } = useNuxtApp()

  // Composables에서 사용할 클라이언트용 GET
  const reqGet = async <T>(url: string, query: Record<string, unknown>) => {
    return await $api<T>(url, { method: "GET", query })
  }

  // Composables에서 사용할 클라이언트용 POST
  const reqPost = async <T>(url: string, body: Record<string, unknown> | BodyInit | FormData) => {
    return await $api<T>(url, { method: "POST", body })
  }

  // Composables에서 사용할 클라이언트용 PATCH
  const reqPatch = async <T>(
    url: string,
    body: Record<string, unknown> | BodyInit | FormData,
    query: Record<string, unknown> = {},
  ) => {
    return await $api<T>(url, { method: "PATCH", body, query })
  }

  // Composables에서 사용할 클라이언트용 DELETE
  const reqDelete = async <T>(url: string, query: Record<string, unknown>) => {
    return await $api<T>(url, { method: "DELETE", query })
  }

  return {
    reqGet,
    reqPost,
    reqPatch,
    reqDelete,
  }
}
